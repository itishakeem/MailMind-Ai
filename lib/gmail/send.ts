import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { encryptToken, decryptToken } from "@/lib/gmail/oauth";

interface GmailTokenData {
  access_token: string;
  refresh_token: string | null;
  expires_at: number;
}

export class GmailSendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GmailSendError";
  }
}

// Builds an RFC 2822 email message encoded in base64url for the Gmail API.
function buildRawMessage(to: string, subject: string, body: string): string {
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    "",
    body,
  ].join("\r\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Refreshes the access token using the stored refresh token.
// Updates the encrypted token in Supabase and returns the new access token.
async function refreshAccessToken(
  userId: string,
  tokenData: GmailTokenData
): Promise<string> {
  if (!tokenData.refresh_token) {
    throw new GmailSendError("No refresh token available. Please reconnect Gmail.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokenData.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new GmailSendError(
      "Gmail token refresh failed. Please reconnect Gmail in Settings."
    );
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  const newTokenData: GmailTokenData = {
    ...tokenData,
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  // Persist updated token
  const supabase = await createClient();
  await supabase
    .from("users")
    .update({ gmail_token: encryptToken(newTokenData) })
    .eq("id", userId);

  return data.access_token;
}

// Sends an email from the user's connected Gmail account.
// Handles transparent token refresh on 401. Throws GmailSendError on failure.
export async function sendGmail(
  userId: string,
  to: string,
  subject: string,
  body: string
): Promise<{ messageId: string }> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("users")
    .select("gmail_token")
    .eq("id", userId)
    .single();

  if (error || !profile?.gmail_token) {
    throw new GmailSendError("Gmail not connected. Please connect Gmail in Settings.");
  }

  let tokenData = decryptToken<GmailTokenData>(profile.gmail_token);

  // Proactively refresh if token expires within 5 minutes
  if (tokenData.expires_at && tokenData.expires_at - Date.now() < 5 * 60 * 1000) {
    tokenData.access_token = await refreshAccessToken(userId, tokenData);
  }

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ access_token: tokenData.access_token });

  const gmail = google.gmail({ version: "v1", auth });

  try {
    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: buildRawMessage(to, subject, body) },
    });

    return { messageId: res.data.id ?? "" };
  } catch (err: unknown) {
    // 401 = token expired mid-flight, attempt one refresh + retry
    const status = (err as { code?: number })?.code;
    if (status === 401) {
      tokenData.access_token = await refreshAccessToken(userId, tokenData);
      auth.setCredentials({ access_token: tokenData.access_token });

      const retryRes = await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw: buildRawMessage(to, subject, body) },
      });

      return { messageId: retryRes.data.id ?? "" };
    }

    throw new GmailSendError(
      `Failed to send email: ${(err as Error).message ?? "Unknown error"}`
    );
  }
}

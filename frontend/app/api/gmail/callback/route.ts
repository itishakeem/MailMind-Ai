import { createClient } from "@/lib/supabase/server";
import { encryptToken } from "@/lib/gmail/oauth";
import { NextResponse, type NextRequest } from "next/server";

// Handles the Google OAuth callback after user grants Gmail send permission.
// Validates PKCE state, exchanges code for tokens, encrypts & stores in Supabase.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const storedState = request.cookies.get("gmail_pkce_state")?.value;
  const codeVerifier = request.cookies.get("gmail_pkce_verifier")?.value;

  // Clear PKCE cookies regardless of outcome
  const clearCookies = (res: NextResponse) => {
    res.cookies.set("gmail_pkce_state", "", { maxAge: 0, path: "/" });
    res.cookies.set("gmail_pkce_verifier", "", { maxAge: 0, path: "/" });
    return res;
  };

  if (errorParam === "access_denied") {
    return clearCookies(
      NextResponse.redirect(new URL("/settings?error=gmail_denied", request.url))
    );
  }

  if (!code || !state || state !== storedState || !codeVerifier) {
    return clearCookies(
      NextResponse.redirect(new URL("/settings?error=gmail_invalid_state", request.url))
    );
  }

  // Exchange code for tokens using PKCE
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GMAIL_REDIRECT_URI!,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    return clearCookies(
      NextResponse.redirect(new URL("/settings?error=gmail_token_exchange_failed", request.url))
    );
  }

  const tokens = await tokenRes.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  // Fetch the Gmail address for display
  const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userinfo = userinfoRes.ok
    ? (await userinfoRes.json() as { email?: string })
    : {};

  const encryptedToken = encryptToken({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_at: Date.now() + tokens.expires_in * 1000,
  });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return clearCookies(
      NextResponse.redirect(new URL("/auth/login", request.url))
    );
  }

  await supabase
    .from("users")
    .update({
      gmail_token: encryptedToken,
      gmail_email: userinfo.email ?? null,
    })
    .eq("id", user.id);

  return clearCookies(
    NextResponse.redirect(new URL("/dashboard?gmail=connected", request.url))
  );
}

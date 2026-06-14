import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { randomBytes, createHash } from "crypto";

function base64url(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Initiates the Gmail OAuth 2.0 PKCE flow.
// Stores code_verifier + state in secure cookies, redirects to Google consent.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const codeVerifier = base64url(randomBytes(32));
  const codeChallenge = base64url(
    createHash("sha256").update(codeVerifier).digest()
  );
  const state = base64url(randomBytes(16));

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GMAIL_REDIRECT_URI!,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.send",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    access_type: "offline",
    prompt: "consent",
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  const response = NextResponse.redirect(googleAuthUrl);

  // Store PKCE values in short-lived HTTP-only cookies
  const cookieOpts = { httpOnly: true, secure: true, maxAge: 600, path: "/" } as const;
  response.cookies.set("gmail_pkce_verifier", codeVerifier, cookieOpts);
  response.cookies.set("gmail_pkce_state", state, cookieOpts);

  return response;
}

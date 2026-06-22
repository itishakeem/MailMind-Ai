import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

// Handles Supabase OAuth callback (Google login).
// Exchanges the auth code for a session, then routes:
//   - New user (no gmail_token) → /settings (Gmail connect prompt)
//   - Returning user → /dashboard
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/dashboard";
  // Ensure next is a relative path to prevent open redirect via double-slash URLs
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if this user already has Gmail connected
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("gmail_token")
          .eq("id", user.id)
          .single();

        const destination = profile?.gmail_token ? next : "/settings";
        return NextResponse.redirect(`${origin}${destination}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`);
}

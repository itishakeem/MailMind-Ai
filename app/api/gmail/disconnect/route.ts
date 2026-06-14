import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/gmail/oauth";
import { NextResponse } from "next/server";

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("gmail_token")
    .eq("id", user.id)
    .single();

  // Attempt to revoke the Google OAuth token (best-effort, don't fail if it errors)
  if (profile?.gmail_token) {
    try {
      const tokenData = decryptToken<{ access_token: string }>(profile.gmail_token);
      await fetch(
        `https://oauth2.googleapis.com/revoke?token=${tokenData.access_token}`,
        { method: "POST" }
      );
    } catch {
      // Token revocation failure is non-fatal — we still clear locally
    }
  }

  // Count scheduled emails before marking them failed
  const { count: pausedCount } = await supabase
    .from("emails")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "scheduled");

  // Mark scheduled emails as failed so the cron job skips them
  await supabase
    .from("emails")
    .update({ status: "failed", failure_reason: "gmail_disconnected" })
    .eq("user_id", user.id)
    .eq("status", "scheduled");

  // Clear token from users table
  await supabase
    .from("users")
    .update({ gmail_token: null, gmail_email: null })
    .eq("id", user.id);

  return NextResponse.json({ success: true, paused_count: pausedCount ?? 0 });
}

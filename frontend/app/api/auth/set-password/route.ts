import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.reset_token || !body?.password) {
    return NextResponse.json({ error: "reset_token and password are required" }, { status: 400 });
  }

  const { reset_token, password } = body as { reset_token: string; password: string };

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: token } = await admin
    .from("otp_tokens")
    .select("*")
    .eq("reset_token", reset_token)
    .eq("verified", true)
    .eq("type", "password_reset")
    .single();

  if (!token) {
    return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
  }

  if (new Date(token.expires_at) < new Date()) {
    await admin.from("otp_tokens").delete().eq("id", token.id);
    return NextResponse.json({ error: "Reset session expired. Please start over." }, { status: 400 });
  }

  // Find user by email via public.users table
  const { data: profile } = await admin
    .from("users")
    .select("id")
    .eq("email", token.email)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(profile.id, { password });
  if (updateError) {
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }

  await admin.from("otp_tokens").delete().eq("id", token.id);
  return NextResponse.json({ success: true });
}

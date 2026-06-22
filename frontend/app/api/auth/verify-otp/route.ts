import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";

const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { email, otp, type, name, password } = body as {
    email: string;
    otp: string;
    type: "signup" | "password_reset";
    name?: string;
    password?: string;
  };

  if (!email || !otp || !type) {
    return NextResponse.json({ error: "email, otp, and type are required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: token } = await admin
    .from("otp_tokens")
    .select("*")
    .eq("email", email)
    .eq("type", type)
    .eq("verified", false)
    .single();

  if (!token) {
    return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
  }

  // Brute-force lockout — checked before expiry to avoid timing oracle
  if ((token.attempts ?? 0) >= MAX_ATTEMPTS) {
    await admin.from("otp_tokens").delete().eq("id", token.id);
    return NextResponse.json(
      { error: "Too many incorrect attempts. Please request a new code." },
      { status: 429 }
    );
  }

  if (new Date(token.expires_at) < new Date()) {
    await admin.from("otp_tokens").delete().eq("id", token.id);
    return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
  }

  // Constant-time comparison to prevent timing attacks
  const otpBuf    = Buffer.from(otp.padEnd(32));
  const storedBuf = Buffer.from((token.otp as string).padEnd(32));
  const match     = otpBuf.length === storedBuf.length &&
                    crypto.timingSafeEqual(otpBuf, storedBuf);

  if (!match) {
    await admin
      .from("otp_tokens")
      .update({ attempts: (token.attempts ?? 0) + 1 })
      .eq("id", token.id);

    const attemptsLeft = MAX_ATTEMPTS - (token.attempts ?? 0) - 1;
    return NextResponse.json(
      { error: `Incorrect code. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining.` },
      { status: 400 }
    );
  }

  // ── Signup ──────────────────────────────────────────────────────────────────
  if (type === "signup") {
    if (!name || !password) {
      return NextResponse.json({ error: "name and password are required for signup" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    await admin.from("otp_tokens").delete().eq("id", token.id);
    return NextResponse.json({ success: true });
  }

  // ── Password reset ───────────────────────────────────────────────────────────
  const resetToken = crypto.randomUUID();
  await admin
    .from("otp_tokens")
    .update({ verified: true, reset_token: resetToken })
    .eq("id", token.id);

  return NextResponse.json({ success: true, reset_token: resetToken });
}

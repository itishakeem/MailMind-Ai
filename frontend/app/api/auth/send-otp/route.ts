import { createAdminClient } from "@/lib/supabase/admin";
import { transporter, buildOtpEmail } from "@/lib/email/mailer";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse, type NextRequest } from "next/server";
import { randomInt } from "crypto";

// Cryptographically random 6-digit OTP (100000–999999).
function generateOtp(): string {
  return randomInt(100_000, 1_000_000).toString();
}

// 5 OTP sends per email per 10 minutes — prevents email spam abuse.
const OTP_RATE_LIMIT     = 5;
const OTP_RATE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.type) {
    return NextResponse.json({ error: "email and type are required" }, { status: 400 });
  }

  const { email, type } = body as { email: string; type: "signup" | "password_reset" };

  if (!["signup", "password_reset"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  // Rate-limit by email to prevent OTP spam
  const { allowed } = rateLimit(
    `send-otp:${email.toLowerCase()}`,
    OTP_RATE_LIMIT,
    OTP_RATE_WINDOW_MS
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many code requests. Please wait 10 minutes before trying again." },
      { status: 429, headers: { "Retry-After": "600" } }
    );
  }

  const admin = createAdminClient();

  // For password reset, silently succeed if email not found (don't leak existence)
  if (type === "password_reset") {
    const { data: profile } = await admin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();
    if (!profile) return NextResponse.json({ success: true });
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Replace any existing OTP for this email+type
  await admin.from("otp_tokens").delete().eq("email", email).eq("type", type);

  const { error: insertError } = await admin.from("otp_tokens").insert({
    email,
    otp,
    type,
    expires_at: expiresAt,
    attempts: 0,
  });

  if (insertError) {
    console.error("[OTP] Insert failed:", insertError.message);
    return NextResponse.json({ error: "Failed to create OTP" }, { status: 500 });
  }

  const { subject, html } = buildOtpEmail(otp, type);

  try {
    await transporter.sendMail({
      from: `"MailMind AI" <${process.env.MAILER_USER}>`,
      to: email,
      subject,
      html,
    });
  } catch (err) {
    console.error("[Mailer] Failed to send OTP:", err);
    return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

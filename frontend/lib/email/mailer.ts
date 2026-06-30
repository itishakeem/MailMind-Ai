import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_APP_PASSWORD,
  },
});

export function buildOtpEmail(
  otp: string,
  type: "signup" | "password_reset"
): { subject: string; html: string } {
  const isSignup = type === "signup";
  const subject = isSignup
    ? "Your MailMind AI verification code"
    : "Your MailMind AI password reset code";
  const title = isSignup ? "Email Verification" : "Password Reset";
  const message = isSignup
    ? "Use the code below to verify your email and complete your registration."
    : "Use the code below to reset your password. If you didn't request this, you can safely ignore this email.";

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:Inter,Arial,sans-serif;background:#f1f5f9;margin:0;padding:40px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);">
    <div style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:36px 40px;text-align:center;">
      <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0;letter-spacing:-0.5px;">MailMind AI</h1>
      <p style="color:rgba(255,255,255,0.65);font-size:13px;margin:6px 0 0;font-weight:500;">${title}</p>
    </div>
    <div style="padding:40px;">
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px;">${message}</p>
      <div style="background:linear-gradient(135deg,rgba(37,99,235,0.05),rgba(79,70,229,0.08));border:1.5px solid rgba(79,70,229,0.18);border-radius:14px;padding:28px;text-align:center;margin:0 0 24px;">
        <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 10px;font-weight:700;">One-Time Code</p>
        <p style="font-size:44px;font-weight:900;letter-spacing:0.25em;color:#1e1b4b;margin:0;font-family:'Courier New',monospace;">${otp}</p>
      </div>
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">This code expires in <strong style="color:#6b7280;">10 minutes</strong>. Do not share it.</p>
    </div>
    <div style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        Sent from <a href="mailto:mailmindspt@gmail.com" style="color:#4f46e5;text-decoration:none;font-weight:600;">mailmindspt@gmail.com</a>
        &nbsp;·&nbsp; MailMind AI Support
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}

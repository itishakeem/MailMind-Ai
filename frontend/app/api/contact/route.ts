import { createAdminClient } from "@/lib/supabase/admin";
import { transporter } from "@/lib/email/mailer";
import { NextResponse, type NextRequest } from "next/server";

const VALID_SUBJECTS = ["General", "Bug Report", "Feature Request", "Partnership"] as const;
type Subject = typeof VALID_SUBJECTS[number];

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_S = 3600; // 1 hour

interface ContactBody {
  name: string;
  email: string;
  subject: Subject;
  message: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  const body: Partial<ContactBody> = await request.json().catch(() => ({}));

  // Validate input
  const errs: Record<string, string> = {};
  if (!body.name?.trim() || body.name.trim().length > 100)
    errs.name = "Name is required (max 100 chars).";
  if (!body.email || !isValidEmail(body.email))
    errs.email = "Valid email address is required.";
  if (!body.subject || !VALID_SUBJECTS.includes(body.subject))
    errs.subject = "Subject must be one of: General, Bug Report, Feature Request, Partnership.";
  const msgLen = body.message?.trim().length ?? 0;
  if (msgLen < 10 || msgLen > 2000)
    errs.message = "Message must be 10–2000 characters.";

  if (Object.keys(errs).length > 0) {
    return NextResponse.json({ errors: errs }, { status: 400 });
  }

  const supabase = createAdminClient();
  const normalizedEmail = body.email!.toLowerCase().trim();
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_S * 1000).toISOString();

  // DB-backed rate limit: count recent submissions from this email
  const { count } = await supabase
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .eq("email", normalizedEmail)
    .gte("created_at", windowStart);

  if ((count ?? 0) >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(RATE_LIMIT_WINDOW_S) },
      }
    );
  }

  await supabase.from("contacts").insert({
    name:    body.name!.trim(),
    email:   normalizedEmail,
    subject: body.subject!,
    message: body.message!.trim(),
  });
  // Intentionally not throwing on insert error — prevents enumeration and keeps UX clean.

  // Notify via SMTP if configured (uses app mailer, not user Gmail tokens)
  const notifyEmail = process.env.APP_NOTIFY_EMAIL;
  if (notifyEmail && process.env.MAILER_USER && process.env.MAILER_APP_PASSWORD) {
    try {
      await transporter.sendMail({
        from:    `"MailMind AI" <${process.env.MAILER_USER}>`,
        to:      notifyEmail,
        subject: `[Contact] ${body.subject}: ${body.name!.trim()}`,
        text:    `Name: ${body.name!.trim()}\nEmail: ${normalizedEmail}\nSubject: ${body.subject}\n\n${body.message!.trim()}`,
      });
    } catch (err) {
      // Notification failure is non-fatal
      console.warn("[contact] Admin notification failed:", (err as Error).message);
    }
  }

  return NextResponse.json({ success: true });
}

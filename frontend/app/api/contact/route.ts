import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";

const VALID_SUBJECTS = ["General", "Bug Report", "Feature Request", "Partnership"] as const;
type Subject = typeof VALID_SUBJECTS[number];

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

  // Validate
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

  // Store submission — use admin client because contacts is a public form (no auth)
  const supabase = createAdminClient();
  await supabase.from("contacts").insert({
    name:    body.name!.trim(),
    email:   body.email!.toLowerCase().trim(),
    subject: body.subject!,
    message: body.message!.trim(),
  });
  // Intentionally not throwing on insert error — prevents enumeration and keeps UX clean.
  // Failures are visible in Supabase dashboard logs.

  // Optionally notify via Gmail if app token is configured
  const appToken = process.env.APP_GMAIL_REFRESH_TOKEN;
  if (appToken) {
    try {
      const { sendGmail } = await import("@/lib/gmail/send");
      const notifyEmail = process.env.APP_NOTIFY_EMAIL ?? "support@mailmind.ai";
      await sendGmail(
        "system",
        notifyEmail,
        `[Contact] ${body.subject}: ${body.name}`,
        `Name: ${body.name}\nEmail: ${body.email}\nSubject: ${body.subject}\n\n${body.message}`,
      );
    } catch {
      // Notification failure is non-fatal
    }
  }

  return NextResponse.json({ success: true });
}

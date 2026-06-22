import { createAdminClient } from "@/lib/supabase/admin";
import { sendGmail, GmailSendError } from "@/lib/gmail/send";
import { NextResponse, type NextRequest } from "next/server";

// Vercel Cron Job endpoint — fires every 5 minutes (vercel.json).
// Authenticated by CRON_SECRET bearer token.
// Uses service-role Supabase client to access all users' emails (bypasses RLS).
// Idempotency: rows are atomically claimed with status='sending' before delivery,
// so concurrent cron instances cannot double-send the same email.
export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}

async function handler(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Atomically claim up to 50 due emails by setting status = 'sending'.
  // Any row already claimed by a concurrent instance will not match
  // status = 'scheduled' and will be skipped.
  const { data: claimed, error: claimError } = await supabase
    .from("emails")
    .update({ status: "sending" })
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .select("id, user_id, subject, body, client_snapshot, scheduled_at")
    .limit(50);

  if (claimError) {
    console.error("[cron] Failed to claim due emails:", claimError.message);
    return NextResponse.json({ error: "Failed to claim emails" }, { status: 500 });
  }

  const emails = claimed ?? [];
  let succeeded = 0;
  let failed = 0;

  await Promise.allSettled(
    emails.map(async (email) => {
      const snapshot = email.client_snapshot as { email?: string };
      if (!snapshot?.email) {
        await supabase
          .from("emails")
          .update({ status: "failed", failure_reason: "Missing recipient email in snapshot" })
          .eq("id", email.id);
        failed++;
        return;
      }

      try {
        const { messageId } = await sendGmail(
          email.user_id,
          snapshot.email,
          email.subject,
          email.body
        );

        await supabase
          .from("emails")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            failure_reason: null,
            gmail_message_id: messageId,
          })
          .eq("id", email.id);

        succeeded++;
      } catch (err) {
        const reason =
          err instanceof GmailSendError
            ? err.message
            : "Unexpected error during scheduled send";

        await supabase
          .from("emails")
          .update({ status: "failed", failure_reason: reason })
          .eq("id", email.id);

        failed++;
        console.error(`[cron] Email ${email.id} failed:`, reason);
      }
    })
  );

  return NextResponse.json({ processed: emails.length, succeeded, failed });
}

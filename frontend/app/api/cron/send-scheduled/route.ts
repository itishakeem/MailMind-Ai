import { createAdminClient } from "@/lib/supabase/admin";
import { sendGmail, GmailSendError } from "@/lib/gmail/send";
import { NextResponse, type NextRequest } from "next/server";

// Vercel Cron Job endpoint — fires every 5 minutes (vercel.json).
// Authenticated by CRON_SECRET bearer token.
// Uses service-role Supabase client to access all users' emails (bypasses RLS).
// Vercel Cron Jobs send GET requests; POST is kept for manual triggers/testing.
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

  // Fetch all emails due for delivery
  const { data: dueEmails, error: fetchError } = await supabase
    .from("emails")
    .select("id, user_id, subject, body, client_snapshot, scheduled_at")
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .limit(50); // Process in batches to stay within serverless time limit

  if (fetchError) {
    console.error("[cron] Failed to fetch due emails:", fetchError.message);
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
  }

  const emails = dueEmails ?? [];
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

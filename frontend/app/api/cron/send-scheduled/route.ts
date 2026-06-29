import { createAdminClient } from "@/lib/supabase/admin";
import { sendGmail, GmailSendError } from "@/lib/gmail/send";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailType } from "@/types";

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
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[cron] CRON_SECRET is not configured");
    return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
  }

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Two-step atomic claim to prevent double-sends across concurrent cron instances.
  // Step 1: Find candidate IDs.
  const { data: candidates, error: selectError } = await supabase
    .from("emails")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .limit(50);

  if (selectError) {
    console.error("[cron] Failed to fetch due emails:", selectError.message);
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
  }

  const ids = (candidates ?? []).map((e) => e.id as string);
  if (ids.length === 0) {
    return NextResponse.json({ processed: 0, succeeded: 0, failed: 0 });
  }

  // Step 2: Claim by setting status='sending' WHERE status='scheduled'.
  // If a concurrent cron already claimed a row, its status won't be 'scheduled'
  // anymore and it won't appear in the RETURNING result — no double-send possible.
  const { data: claimed, error: claimError } = await supabase
    .from("emails")
    .update({ status: "sending" })
    .eq("status", "scheduled")
    .in("id", ids)
    .select("id, user_id, subject, body, client_snapshot, scheduled_at, ai_detected_type");

  if (claimError) {
    console.error("[cron] Failed to claim emails:", claimError.message);
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
          email.body,
          {
            emailType: (email as { ai_detected_type?: EmailType }).ai_detected_type,
            adminClient: supabase,
          }
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

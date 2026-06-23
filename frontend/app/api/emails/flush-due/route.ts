import { createClient } from "@/lib/supabase/server";
import { sendGmail, GmailSendError } from "@/lib/gmail/send";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();

  const { data: due, error: selectError } = await supabase
    .from("emails")
    .select("id, subject, body, client_snapshot")
    .eq("user_id", user.id)
    .eq("status", "scheduled")
    .lte("scheduled_at", now);

  if (selectError) {
    console.error("[flush-due] SELECT failed:", selectError);
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  const emails = due ?? [];
  if (emails.length === 0) {
    return NextResponse.json({ processed: 0, succeeded: 0, failed: 0 });
  }

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
          user.id,
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
          err instanceof GmailSendError ? err.message : `Unexpected error: ${(err as Error).message}`;
        console.error(`[flush-due] Email ${email.id} failed:`, reason);
        await supabase
          .from("emails")
          .update({ status: "failed", failure_reason: reason })
          .eq("id", email.id);
        failed++;
      }
    })
  );

  return NextResponse.json({ processed: emails.length, succeeded, failed });
}

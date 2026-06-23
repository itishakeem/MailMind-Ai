import { createClient } from "@/lib/supabase/server";
import { sendGmail, GmailSendError } from "@/lib/gmail/send";
import { assertPlanLimit, PlanLimitReachedError } from "@/lib/plan-limits";
import { NextResponse, type NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: email, error: fetchError } = await supabase
    .from("emails")
    .select("id, subject, body, client_snapshot, status, ai_detected_type")
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "failed")
    .single();

  if (fetchError || !email) {
    return NextResponse.json(
      { error: "Email not found, not in failed state, or does not belong to you" },
      { status: 404 }
    );
  }

  const snapshot = email.client_snapshot as { email?: string };
  if (!snapshot?.email) {
    return NextResponse.json({ error: "Client email address not found" }, { status: 400 });
  }

  // Enforce plan limit on retry — same as immediate send
  try {
    await assertPlanLimit(supabase, user.id, "email_send");
  } catch (err) {
    if (err instanceof PlanLimitReachedError) {
      return NextResponse.json(err.details, { status: 402 });
    }
    return NextResponse.json({ error: "Failed to check plan limits" }, { status: 500 });
  }

  try {
    const { messageId } = await sendGmail(
      user.id,
      snapshot.email,
      email.subject,
      email.body,
      { emailType: (email as { ai_detected_type?: string }).ai_detected_type as import("@/types").EmailType ?? null }
    );

    await supabase
      .from("emails")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        failure_reason: null,
        gmail_message_id: messageId,
      })
      .eq("id", id);

    return NextResponse.json({ email_id: id, gmail_message_id: messageId });
  } catch (err) {
    if (err instanceof GmailSendError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Unexpected error during retry" }, { status: 500 });
  }
}

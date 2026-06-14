import { createClient } from "@/lib/supabase/server";
import { assertPlanLimit, PlanLimitReachedError } from "@/lib/plan-limits";
import { sendGmail, GmailSendError } from "@/lib/gmail/send";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailType, Tone } from "@/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { client_id, subject, body: emailBody, ai_detected_type, tone } = body as {
    client_id?: string;
    subject?: string;
    body?: string;
    ai_detected_type?: EmailType;
    tone?: Tone;
  };

  if (!client_id) return NextResponse.json({ error: "client_id is required" }, { status: 400 });
  if (!subject?.trim()) return NextResponse.json({ error: "subject is required" }, { status: 400 });
  if (!emailBody?.trim()) return NextResponse.json({ error: "body is required" }, { status: 400 });

  // Fetch client to get recipient email and build snapshot
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name, email")
    .eq("id", client_id)
    .eq("user_id", user.id)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Check monthly email limit
  try {
    await assertPlanLimit(supabase, user.id, "email_send");
  } catch (err) {
    if (err instanceof PlanLimitReachedError) {
      return NextResponse.json(err.details, { status: 402 });
    }
    return NextResponse.json({ error: "Failed to check plan limits" }, { status: 500 });
  }

  // Send via Gmail
  let messageId: string;
  try {
    const result = await sendGmail(user.id, client.email, subject.trim(), emailBody.trim());
    messageId = result.messageId;
  } catch (err) {
    if (err instanceof GmailSendError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  // Persist the sent email record
  const { data: emailRecord, error: insertError } = await supabase
    .from("emails")
    .insert({
      user_id: user.id,
      client_id: client.id,
      client_snapshot: { name: client.name, email: client.email },
      subject: subject.trim(),
      body: emailBody.trim(),
      ai_detected_type: ai_detected_type ?? null,
      tone: tone ?? null,
      status: "sent",
      sent_at: new Date().toISOString(),
      gmail_message_id: messageId,
    })
    .select("id")
    .single();

  if (insertError || !emailRecord) {
    // Email was sent but record failed — not ideal but not fatal
    console.error("[send] Failed to insert email record:", insertError?.message);
    return NextResponse.json({ email_id: null, gmail_message_id: messageId }, { status: 201 });
  }

  return NextResponse.json(
    { email_id: emailRecord.id, gmail_message_id: messageId },
    { status: 201 }
  );
}

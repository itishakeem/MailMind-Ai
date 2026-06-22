import { createClient } from "@/lib/supabase/server";
import { assertPlanLimit, PlanLimitReachedError } from "@/lib/plan-limits";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailType, Tone } from "@/types";

const MAX_SUBJECT_LENGTH = 998;
const MAX_BODY_LENGTH    = 50_000;

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

  const { client_id, subject, body: emailBody, scheduled_at, ai_detected_type, tone } = body as {
    client_id?: string;
    subject?: string;
    body?: string;
    scheduled_at?: string;
    ai_detected_type?: EmailType;
    tone?: Tone;
  };

  if (!client_id) {
    return NextResponse.json({ error: "client_id is required" }, { status: 400 });
  }
  if (!subject?.trim()) {
    return NextResponse.json({ error: "subject is required" }, { status: 400 });
  }
  if (subject.trim().length > MAX_SUBJECT_LENGTH) {
    return NextResponse.json(
      { error: `Subject must be ${MAX_SUBJECT_LENGTH} characters or fewer`, field: "subject" },
      { status: 400 }
    );
  }
  if (!emailBody?.trim()) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }
  if (emailBody.trim().length > MAX_BODY_LENGTH) {
    return NextResponse.json(
      { error: `Body must be ${MAX_BODY_LENGTH.toLocaleString()} characters or fewer`, field: "body" },
      { status: 400 }
    );
  }
  if (!scheduled_at) {
    return NextResponse.json({ error: "scheduled_at is required" }, { status: 400 });
  }

  const scheduledDate = new Date(scheduled_at);
  const oneMinuteFromNow = new Date(Date.now() + 60 * 1000);

  if (isNaN(scheduledDate.getTime()) || scheduledDate < oneMinuteFromNow) {
    return NextResponse.json(
      { error: "scheduled_at must be at least 1 minute in the future" },
      { status: 400 }
    );
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name, email")
    .eq("id", client_id)
    .eq("user_id", user.id)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  try {
    await assertPlanLimit(supabase, user.id, "email_send");
  } catch (err) {
    if (err instanceof PlanLimitReachedError) {
      return NextResponse.json(err.details, { status: 402 });
    }
    return NextResponse.json({ error: "Failed to check plan limits" }, { status: 500 });
  }

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
      status: "scheduled",
      scheduled_at: scheduledDate.toISOString(),
    })
    .select("id, scheduled_at")
    .single();

  if (insertError || !emailRecord) {
    return NextResponse.json({ error: "Failed to schedule email" }, { status: 500 });
  }

  return NextResponse.json(
    { email_id: emailRecord.id, scheduled_at: emailRecord.scheduled_at },
    { status: 201 }
  );
}

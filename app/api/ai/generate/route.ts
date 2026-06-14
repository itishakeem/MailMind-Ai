import { createClient } from "@/lib/supabase/server";
import { generateEmail, AIUnavailableError } from "@/lib/ai/generate";
import { assertPlanLimit, PlanLimitReachedError } from "@/lib/plan-limits";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailType, Tone } from "@/types";

const VALID_TYPES: EmailType[] = ["invoice", "payment_reminder", "project_update", "proposal"];
const VALID_TONES: Tone[] = ["friendly", "formal", "strict"];

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

  const { text, tone, email_type, client_name } = body as {
    text?: string;
    tone?: string;
    email_type?: string;
    client_name?: string;
  };

  if (!text || text.trim().length < 10) {
    return NextResponse.json({ error: "text must be at least 10 characters" }, { status: 400 });
  }
  if (!tone || !VALID_TONES.includes(tone as Tone)) {
    return NextResponse.json({ error: "tone must be friendly, formal, or strict" }, { status: 400 });
  }
  if (!email_type || !VALID_TYPES.includes(email_type as EmailType)) {
    return NextResponse.json({ error: "email_type must be a valid type" }, { status: 400 });
  }

  try {
    await assertPlanLimit(supabase, user.id, "email_send");

    const result = await generateEmail({
      text: text.trim(),
      type: email_type as EmailType,
      tone: tone as Tone,
      clientName: client_name?.trim() || undefined,
    });

    return NextResponse.json({
      subject: result.subject,
      body: result.body,
      model_used: result.model_used,
    });
  } catch (err) {
    if (err instanceof PlanLimitReachedError) {
      return NextResponse.json({ error: err.details.error, upgrade: true }, { status: 402 });
    }
    if (err instanceof AIUnavailableError) {
      return NextResponse.json(
        { error: err.message, fallback_mode: true, retry_after_ms: 5000 },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

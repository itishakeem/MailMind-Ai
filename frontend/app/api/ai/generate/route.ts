import { createClient } from "@/lib/supabase/server";
import { generateEmail, AIUnavailableError } from "@/lib/ai/generate";
import { assertPlanLimit, PlanLimitReachedError } from "@/lib/plan-limits";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailType, Tone } from "@/types";

const VALID_TYPES: EmailType[] = ["invoice", "payment_reminder", "project_update", "proposal"];
const FREE_TONES: Tone[] = ["friendly", "formal", "strict"];
const ALL_TONES: Tone[] = ["friendly", "formal", "strict", "urgent", "apologetic", "persuasive"];
const MAX_TEXT_LENGTH = 10_000;

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
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `text exceeds the ${MAX_TEXT_LENGTH.toLocaleString()} character limit` },
      { status: 400 }
    );
  }
  if (!tone || !ALL_TONES.includes(tone as Tone)) {
    return NextResponse.json({ error: "Invalid tone" }, { status: 400 });
  }

  // Fetch user plan to gate Pro tones and Pro model
  const { data: userData } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .single();
  const isPro = userData?.plan === "pro" || userData?.plan === "business";

  if (!isPro && !FREE_TONES.includes(tone as Tone)) {
    return NextResponse.json({ error: "Pro plan required for this tone", upgrade_required: true }, { status: 403 });
  }

  if (!email_type || !VALID_TYPES.includes(email_type as EmailType)) {
    return NextResponse.json({ error: "email_type must be a valid type" }, { status: 400 });
  }

  try {
    await assertPlanLimit(supabase, user.id, "email_send");

    const senderName = (user.user_metadata?.full_name as string | undefined)?.trim() || undefined;

    const result = await generateEmail({
      text: text.trim(),
      type: email_type as EmailType,
      tone: tone as Tone,
      clientName: client_name?.trim() || undefined,
      senderName,
      isPro,
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
    return NextResponse.json({ error: "Unexpected error generating email" }, { status: 500 });
  }
}

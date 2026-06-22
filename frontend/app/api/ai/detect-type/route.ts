import { createClient } from "@/lib/supabase/server";
import { detectEmailType, AIUnavailableError } from "@/lib/ai/generate";
import { NextResponse, type NextRequest } from "next/server";

const MAX_TEXT_LENGTH = 10_000;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body?.text || typeof body.text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const text: string = body.text;

  if (text.trim().length < 10) {
    return NextResponse.json(
      { error: "text must be at least 10 characters" },
      { status: 400 }
    );
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `text exceeds the ${MAX_TEXT_LENGTH.toLocaleString()} character limit` },
      { status: 400 }
    );
  }

  try {
    const result = await detectEmailType(text);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AIUnavailableError) {
      return NextResponse.json(
        { error: err.message, fallback_mode: true, retry_after_ms: 5000 },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

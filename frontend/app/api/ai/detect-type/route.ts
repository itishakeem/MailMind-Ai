import { createClient } from "@/lib/supabase/server";
import { detectEmailType, AIUnavailableError } from "@/lib/ai/generate";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.text || typeof body.text !== "string" || body.text.trim().length < 10) {
    return NextResponse.json(
      { error: "text must be at least 10 characters" },
      { status: 400 }
    );
  }

  try {
    const result = await detectEmailType(body.text);
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

import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.signature !== "string") {
    return NextResponse.json({ error: "signature must be a string" }, { status: 400 });
  }

  const signature = body.signature.trim();
  if (signature.length > 500) {
    return NextResponse.json({ error: "Signature must be 500 characters or fewer" }, { status: 400 });
  }

  const { error } = await supabase
    .from("users")
    .update({ email_signature: signature || null })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to save signature" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

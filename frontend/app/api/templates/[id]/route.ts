import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userData } = await supabase.from("users").select("plan").eq("id", user.id).single();
  const isPro = userData?.plan === "pro" || userData?.plan === "business";
  if (!isPro) return NextResponse.json({ error: "Pro plan required", upgrade_required: true }, { status: 403 });

  const { error } = await supabase
    .from("email_templates")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  return NextResponse.json({ success: true });
}

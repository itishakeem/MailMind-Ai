import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("emails")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "scheduled");

  if (error) {
    return NextResponse.json(
      { error: "Email not found, already sent, or does not belong to you" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}

import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.scheduled_at) {
    return NextResponse.json({ error: "scheduled_at is required" }, { status: 400 });
  }

  const scheduledAt = new Date(body.scheduled_at);
  if (isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
    return NextResponse.json(
      { error: "scheduled_at must be a valid future date and time" },
      { status: 400 }
    );
  }

  const { data: updated, error } = await supabase
    .from("emails")
    .update({ scheduled_at: scheduledAt.toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "scheduled")
    .select()
    .single();

  if (error || !updated) {
    return NextResponse.json(
      { error: "Email not found, already sent, or does not belong to you" },
      { status: 404 }
    );
  }

  return NextResponse.json(updated);
}

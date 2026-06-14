import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: emails, error } = await supabase
    .from("emails")
    .select("id, subject, client_snapshot, status, scheduled_at, failure_reason, created_at")
    .eq("user_id", user.id)
    .in("status", ["scheduled", "failed"])
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch scheduled emails" }, { status: 500 });
  }

  return NextResponse.json({ emails: emails ?? [] });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userData } = await supabase.from("users").select("plan").eq("id", user.id).single();
  const isPro = userData?.plan === "pro" || userData?.plan === "business";
  if (!isPro) return NextResponse.json({ error: "Pro plan required", upgrade_required: true }, { status: 403 });

  const { data, error } = await supabase
    .from("emails")
    .select("created_at, client_snapshot, subject, status, ai_detected_type")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to load emails" }, { status: 500 });

  const headers = ["Date", "Client Name", "Client Email", "Subject", "Status", "Email Type"];
  const rows = (data ?? []).map((e) => [
    new Date(e.created_at).toISOString().split("T")[0],
    e.client_snapshot?.name ?? "",
    e.client_snapshot?.email ?? "",
    e.subject ?? "",
    e.status ?? "",
    e.ai_detected_type ?? "",
  ]);

  const csv = toCsv(headers, rows);
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mailmind-emails-${date}.csv"`,
    },
  });
}

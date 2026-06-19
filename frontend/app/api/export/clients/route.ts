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
    .from("clients")
    .select("name, email, phone, company, address, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to load clients" }, { status: 500 });

  const headers = ["Name", "Email", "Phone", "Company", "Address", "Added Date"];
  const rows = (data ?? []).map((c) => [
    c.name ?? "",
    c.email ?? "",
    c.phone ?? "",
    c.company ?? "",
    c.address ?? "",
    new Date(c.created_at).toISOString().split("T")[0],
  ]);

  const csv = toCsv(headers, rows);
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mailmind-clients-${date}.csv"`,
    },
  });
}

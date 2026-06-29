import { requireRole } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { error } = await requireRole("support");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const perPage = 25;
  const offset  = (page - 1) * perPage;

  const db = createAdminClient();
  const { data, count, error: dbError } = await db
    .from("contacts")
    .select("id, name, email, subject, message, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  if (dbError) {
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }

  return NextResponse.json({ contacts: data ?? [], total: count ?? 0, page, per_page: perPage });
}

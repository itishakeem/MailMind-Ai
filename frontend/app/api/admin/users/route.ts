import { requireRole } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { error } = await requireRole("support");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search  = searchParams.get("search")?.trim() ?? "";
  const plan    = searchParams.get("plan") ?? "";
  const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const perPage = 20;
  const offset  = (page - 1) * perPage;

  const db = createAdminClient();
  let query = db
    .from("users")
    .select("id, name, email, plan, gmail_email, role, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (plan && ["free", "pro", "business"].includes(plan)) {
    query = query.eq("plan", plan);
  }

  const { data, count, error: dbError } = await query;
  if (dbError) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  return NextResponse.json({ users: data ?? [], total: count ?? 0, page, per_page: perPage });
}

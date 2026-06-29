import { requireRole } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireRole("support");
  if (error) return error;

  const db = createAdminClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    totalUsersRes,
    newUsersRes,
    planDistRes,
    totalEmailsRes,
    sentThisMonthRes,
    failedRes,
    scheduledRes,
    totalClientsRes,
    gmailRes,
    contactsRes,
    recentUsersRes,
  ] = await Promise.all([
    db.from("users").select("id", { count: "exact", head: true }),
    db.from("users").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth),
    db.from("users").select("plan"),
    db.from("emails").select("id", { count: "exact", head: true }),
    db.from("emails").select("id", { count: "exact", head: true }).eq("status", "sent").gte("sent_at", startOfMonth),
    db.from("emails").select("id", { count: "exact", head: true }).eq("status", "failed"),
    db.from("emails").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
    db.from("clients").select("id", { count: "exact", head: true }),
    db.from("users").select("id", { count: "exact", head: true }).not("gmail_email", "is", null),
    db.from("contacts").select("id", { count: "exact", head: true }),
    db.from("users")
      .select("id, name, email, plan, gmail_email, role, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const plans = planDistRes.data ?? [];
  const users_by_plan = {
    free:     plans.filter(u => u.plan === "free").length,
    pro:      plans.filter(u => u.plan === "pro").length,
    business: plans.filter(u => u.plan === "business").length,
  };

  return NextResponse.json({
    total_users: totalUsersRes.count ?? 0,
    new_users_this_month: newUsersRes.count ?? 0,
    users_by_plan,
    total_emails: totalEmailsRes.count ?? 0,
    emails_sent_this_month: sentThisMonthRes.count ?? 0,
    emails_failed: failedRes.count ?? 0,
    emails_scheduled: scheduledRes.count ?? 0,
    total_clients: totalClientsRes.count ?? 0,
    gmail_connections: gmailRes.count ?? 0,
    contact_messages: contactsRes.count ?? 0,
    recent_users: recentUsersRes.data ?? [],
  });
}

import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/types";
import { NextResponse } from "next/server";
import type { Plan, ClientActivity, DailyEmailCount } from "@/types";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

  const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Run all queries in parallel
  const [sentResult, scheduledResult, allSentResult, clientCountResult, userResult, weekResult] =
    await Promise.all([
      // Emails sent this calendar month
      supabase
        .from("emails")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "sent")
        .gte("sent_at", startOfMonth)
        .lte("sent_at", endOfMonth),

      // Currently scheduled emails
      supabase
        .from("emails")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "scheduled"),

      // All sent emails for per-client aggregation (capped at 500 to avoid OOM on large accounts)
      supabase
        .from("emails")
        .select("client_id, client_snapshot, sent_at")
        .eq("user_id", user.id)
        .eq("status", "sent")
        .order("sent_at", { ascending: false })
        .limit(500),

      // Client count
      supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),

      // User plan + name
      supabase
        .from("users")
        .select("plan, name")
        .eq("id", user.id)
        .single(),

      // Sent emails over the last 7 days for the activity chart
      supabase
        .from("emails")
        .select("sent_at")
        .eq("user_id", user.id)
        .eq("status", "sent")
        .gte("sent_at", sevenDaysAgo.toISOString()),
    ]);

  const emailsSentThisMonth = sentResult.count ?? 0;
  const scheduledCount = scheduledResult.count ?? 0;
  const clientsCount = clientCountResult.count ?? 0;
  const plan = (userResult.data?.plan ?? "free") as Plan;
  const userName = (userResult.data?.name as string | null) ?? null;
  const limits = PLAN_LIMITS[plan];

  // Aggregate per-client activity in JS (avoids raw SQL)
  const activityMap = new Map<
    string,
    { client_id: string | null; client_name: string; email_count: number; last_sent_at: string | null }
  >();

  for (const email of allSentResult.data ?? []) {
    const snapshot = email.client_snapshot as { name?: string; email?: string } | null;
    const name = snapshot?.name ?? "Unknown Client";
    const key = email.client_id ?? name;

    if (!activityMap.has(key)) {
      activityMap.set(key, {
        client_id: email.client_id ?? null,
        client_name: name,
        email_count: 0,
        last_sent_at: null,
      });
    }

    const entry = activityMap.get(key)!;
    entry.email_count++;
    if (!entry.last_sent_at || (email.sent_at && email.sent_at > entry.last_sent_at)) {
      entry.last_sent_at = email.sent_at;
    }
  }

  const perClientActivity: ClientActivity[] = Array.from(activityMap.values())
    .sort((a, b) => {
      if (!a.last_sent_at) return 1;
      if (!b.last_sent_at) return -1;
      return b.last_sent_at.localeCompare(a.last_sent_at);
    })
    .slice(0, 10);

  // Build 7-day daily counts (today = index 6, 6 days ago = index 0)
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of weekResult.data ?? []) {
    const day = (row.sent_at as string | null)?.slice(0, 10);
    if (day && dailyMap.has(day)) dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
  }
  const daily_emails: DailyEmailCount[] = Array.from(dailyMap.entries()).map(([date, count]) => ({
    date,
    label: DAY_LABELS[new Date(date + "T12:00:00").getDay()],
    count,
  }));

  return NextResponse.json({
    emails_sent_this_month: emailsSentThisMonth,
    scheduled_count: scheduledCount,
    per_client_activity: perClientActivity,
    plan,
    user_name: userName,
    plan_usage: {
      emails_used: emailsSentThisMonth,
      emails_limit: limits.max_emails_per_month,
      clients_used: clientsCount,
      clients_limit: limits.max_clients,
    },
    daily_emails,
  });
}

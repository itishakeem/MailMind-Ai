import { requireRole } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireRole("support");
  if (error) return error;

  const db = createAdminClient();
  const thirtyDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [emailsResult, statusResult, topUsersResult] = await Promise.all([
    db.from("emails")
      .select("status, ai_detected_type, sent_at, created_at")
      .gte("created_at", thirtyDaysAgo.toISOString()),
    db.from("emails").select("status"),
    db.from("emails")
      .select("user_id")
      .eq("status", "sent")
      .limit(2000),
  ]);

  // 30-day daily volume
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyMap = new Map<string, { sent: number; failed: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap.set(d.toISOString().slice(0, 10), { sent: 0, failed: 0 });
  }

  for (const row of emailsResult.data ?? []) {
    const dateKey = (row.sent_at ?? row.created_at)?.slice(0, 10);
    if (dateKey && dailyMap.has(dateKey)) {
      const entry = dailyMap.get(dateKey)!;
      if (row.status === "sent") entry.sent++;
      else if (row.status === "failed") entry.failed++;
    }
  }

  const daily_volume = Array.from(dailyMap.entries()).map(([date, counts]) => ({
    date,
    label: DAY_LABELS[new Date(date + "T12:00:00").getDay()],
    ...counts,
  }));

  // Status breakdown
  const allEmails = statusResult.data ?? [];
  const status_breakdown = {
    sent:      allEmails.filter(e => e.status === "sent").length,
    failed:    allEmails.filter(e => e.status === "failed").length,
    scheduled: allEmails.filter(e => e.status === "scheduled").length,
    draft:     allEmails.filter(e => e.status === "draft").length,
  };

  // Email type distribution
  const typeMap = new Map<string, number>();
  for (const row of emailsResult.data ?? []) {
    if (row.ai_detected_type) {
      typeMap.set(row.ai_detected_type, (typeMap.get(row.ai_detected_type) ?? 0) + 1);
    }
  }
  const type_distribution = Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Top users by email count — aggregate in JS then fetch names
  const countMap = new Map<string, number>();
  for (const row of topUsersResult.data ?? []) {
    countMap.set(row.user_id, (countMap.get(row.user_id) ?? 0) + 1);
  }
  const topIds = Array.from(countMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);

  const { data: topProfiles } = topIds.length > 0
    ? await db.from("users").select("id, name, email").in("id", topIds)
    : { data: [] };

  const profileMap = new Map((topProfiles ?? []).map(p => [p.id, p]));
  const top_users = topIds
    .filter(id => profileMap.has(id))
    .map(id => ({
      user_id:     id,
      name:        profileMap.get(id)!.name,
      email:       profileMap.get(id)!.email,
      email_count: countMap.get(id) ?? 0,
    }));

  return NextResponse.json({ daily_volume, status_breakdown, type_distribution, top_users });
}

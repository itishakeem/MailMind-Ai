import { createClient } from "@/lib/supabase/server";
import { generateMonthlySummary, AIUnavailableError } from "@/lib/ai/generate";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

  // Fetch sent emails this month for summary context
  const { data: sentEmails } = await supabase
    .from("emails")
    .select("client_snapshot, ai_detected_type, sent_at")
    .eq("user_id", user.id)
    .eq("status", "sent")
    .gte("sent_at", startOfMonth)
    .lte("sent_at", endOfMonth)
    .order("sent_at", { ascending: false });

  const emails = sentEmails ?? [];
  if (emails.length === 0) {
    return NextResponse.json({ summary: null });
  }

  // Derive stats for the prompt
  const clientNames = Array.from(
    new Set(
      emails
        .map((e) => (e.client_snapshot as { name?: string })?.name)
        .filter((n): n is string => !!n)
    )
  ).slice(0, 5);

  const typeCounts = emails.reduce<Record<string, number>>((acc, e) => {
    const t = (e.ai_detected_type as string) ?? "general";
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  const commonType = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "general";

  try {
    const summary = await generateMonthlySummary({
      emailsSent: emails.length,
      topClients: clientNames,
      commonType,
    });
    return NextResponse.json({ summary });
  } catch (err) {
    if (err instanceof AIUnavailableError) {
      return NextResponse.json({ summary: null });
    }
    return NextResponse.json({ summary: null });
  }
}

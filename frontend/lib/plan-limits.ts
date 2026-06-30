import type { SupabaseClient } from "@supabase/supabase-js";
import { PLAN_LIMITS, type Plan, type PlanLimitError } from "@/types";

export type LimitType = "email_send" | "client_create";

export class PlanLimitReachedError extends Error {
  public readonly details: PlanLimitError;

  constructor(details: PlanLimitError) {
    super(details.error);
    this.name = "PlanLimitReachedError";
    this.details = details;
  }
}

// Checks whether the user has hit a plan limit.
// Throws PlanLimitReachedError if the limit is exceeded.
// Call this before any create-client or send-email operation.
export async function assertPlanLimit(
  supabase: SupabaseClient,
  userId: string,
  type: LimitType
): Promise<void> {
  const { data: user, error } = await supabase
    .from("users")
    .select("plan")
    .eq("id", userId)
    .single();

  if (error || !user) {
    throw new Error("Could not fetch user plan");
  }

  const plan = user.plan as Plan;
  const limits = PLAN_LIMITS[plan];

  if (type === "client_create") {
    const maxClients = limits.max_clients;
    if (maxClients === null) return;

    const { count, error: countError } = await supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) throw new Error("Could not count clients");

    const current = count ?? 0;
    if (current >= maxClients) {
      throw new PlanLimitReachedError({
        error: `You have reached the ${plan} plan limit of ${maxClients} clients.`,
        limit_type: "clients",
        current_count: current,
        max_allowed: maxClients,
        upgrade_url: "/settings?tab=billing",
      });
    }
  }

  if (type === "email_send") {
    const maxEmails = limits.max_emails_per_day;
    if (maxEmails === null) return;

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Count emails sent in last 24h + all pending scheduled emails.
    // Counting pending prevents gaming the limit by scheduling many at once.
    const [sentResult, scheduledResult] = await Promise.all([
      supabase
        .from("emails")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "sent")
        .gte("sent_at", cutoff),
      supabase
        .from("emails")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("status", ["scheduled", "sending"]),
    ]);

    if (sentResult.error)      throw new Error("Could not count sent emails");
    if (scheduledResult.error) throw new Error("Could not count scheduled emails");

    const current = (sentResult.count ?? 0) + (scheduledResult.count ?? 0);

    if (current >= maxEmails) {
      throw new PlanLimitReachedError({
        error: `You have reached the free plan limit of ${maxEmails} emails per day. Resets in 24 hours.`,
        limit_type: "emails_per_month",
        current_count: current,
        max_allowed: maxEmails,
        upgrade_url: "/settings?tab=billing",
      });
    }
  }
}

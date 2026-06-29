import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Statuses that still entitle the user to Pro access
const PRO_STATUSES = new Set(["on_trial", "active", "past_due", "cancelled"]);

export async function POST(req: NextRequest) {
  const body   = await req.text();
  const sig    = req.headers.get("X-Signature") ?? "";
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[webhook] LEMONSQUEEZY_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  let valid = false;
  try {
    valid = sig.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    valid = false;
  }

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const event:  string           = payload.meta?.event_name ?? "";
  const userId: string | undefined = payload.meta?.custom_data?.user_id;

  // Skip events we can't attribute to a user
  if (!userId) return NextResponse.json({ received: true });

  const subscriptionId = String(payload.data?.id ?? "");
  const customerId     = String(payload.data?.attributes?.customer_id ?? "");
  const status: string = payload.data?.attributes?.status ?? "";

  const supabase = createAdminClient();

  if (
    event === "subscription_created" ||
    (event === "subscription_updated" && PRO_STATUSES.has(status))
  ) {
    await supabase
      .from("users")
      .update({
        plan: "pro",
        lemon_squeezy_customer_id:     customerId,
        lemon_squeezy_subscription_id: subscriptionId,
      })
      .eq("id", userId);
  }

  if (
    event === "subscription_expired" ||
    (event === "subscription_updated" && (status === "expired" || status === "unpaid"))
  ) {
    await supabase
      .from("users")
      .update({
        plan: "free",
        lemon_squeezy_customer_id:     null,
        lemon_squeezy_subscription_id: null,
      })
      .eq("id", userId);
  }

  return NextResponse.json({ received: true });
}

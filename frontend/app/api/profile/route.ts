import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error } = await supabase
    .from("users")
    .select("id, name, email, plan, gmail_email, gmail_token, email_signature, created_at")
    .eq("id", user.id)
    .single();

  if (error || !profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  // Aggregate usage counts
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ count: emailCount }, { count: clientCount }] = await Promise.all([
    supabase
      .from("emails")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "sent")
      .gte("sent_at", monthStart),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  return NextResponse.json({
    id:              profile.id,
    name:            profile.name,
    email:           profile.email,
    plan:            profile.plan,
    gmail_email:     profile.gmail_email,
    gmail_connected: !!profile.gmail_token,
    email_signature: profile.email_signature ?? "",
    created_at:      profile.created_at,
    stats: {
      emails_sent_this_month: emailCount ?? 0,
      total_clients:          clientCount ?? 0,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const updates: Record<string, string> = {};

  if ("name" in body) {
    if (typeof body.name !== "string") return NextResponse.json({ error: "name must be a string" }, { status: 400 });
    const name = body.name.trim();
    if (!name || name.length > 100) return NextResponse.json({ error: "Name must be 1–100 characters" }, { status: 400 });
    updates.name = name;
  }

  if ("email_signature" in body) {
    // Only Pro/Business users can save a signature
    const { data: userData } = await supabase.from("users").select("plan").eq("id", user.id).single();
    const isPro = userData?.plan === "pro" || userData?.plan === "business";
    if (!isPro) return NextResponse.json({ error: "Pro plan required", upgrade_required: true }, { status: 403 });

    if (typeof body.email_signature !== "string") return NextResponse.json({ error: "email_signature must be a string" }, { status: 400 });
    const sig = body.email_signature.slice(0, 500);
    updates.email_signature = sig;
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { error } = await supabase.from("users").update(updates).eq("id", user.id);
  if (error) return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });

  return NextResponse.json({ success: true, ...updates });
}

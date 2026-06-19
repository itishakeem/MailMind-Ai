import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TEMPLATE_CAP = 50;

async function getProUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, userData: null, err: "Unauthorized" };
  const { data } = await supabase.from("users").select("plan").eq("id", user.id).single();
  const isPro = data?.plan === "pro" || data?.plan === "business";
  if (!isPro) return { user: null, userData: null, err: "pro_required" };
  return { user, userData: data, err: null };
}

export async function GET() {
  const supabase = await createClient();
  const { user, err } = await getProUser(supabase);
  if (err === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (err === "pro_required") return NextResponse.json({ error: "Pro plan required", upgrade_required: true }, { status: 403 });

  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { user, err } = await getProUser(supabase);
  if (err === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (err === "pro_required") return NextResponse.json({ error: "Pro plan required", upgrade_required: true }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { name, subject, body: emailBody } = body as { name?: string; subject?: string; body?: string };

  if (!name || name.trim().length < 1 || name.trim().length > 100)
    return NextResponse.json({ error: "name must be 1–100 characters" }, { status: 400 });
  if (!subject || subject.trim().length < 1 || subject.trim().length > 200)
    return NextResponse.json({ error: "subject must be 1–200 characters" }, { status: 400 });
  if (!emailBody || emailBody.trim().length < 1 || emailBody.trim().length > 10000)
    return NextResponse.json({ error: "body must be 1–10,000 characters" }, { status: 400 });

  // Enforce 50-template cap
  const { count } = await supabase
    .from("email_templates")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id);

  if ((count ?? 0) >= TEMPLATE_CAP)
    return NextResponse.json({ error: `Template limit of ${TEMPLATE_CAP} reached` }, { status: 400 });

  const { data, error } = await supabase
    .from("email_templates")
    .insert({ user_id: user!.id, name: name.trim(), subject: subject.trim(), body: emailBody.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to save template" }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getProUserAndClient(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: string
) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, err: "unauthorized" as const };

  const { data: userData } = await supabase.from("users").select("plan").eq("id", user.id).single();
  const isPro = userData?.plan === "pro" || userData?.plan === "business";
  if (!isPro) return { user: null, err: "pro_required" as const };

  // Verify client belongs to user
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .single();
  if (!client) return { user: null, err: "not_found" as const };

  return { user, err: null };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params;
  const supabase = await createClient();
  const { user, err } = await getProUserAndClient(supabase, clientId);

  if (err === "unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (err === "pro_required") return NextResponse.json({ error: "Pro plan required", upgrade_required: true }, { status: 403 });
  if (err === "not_found") return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("client_notes")
    .select("*")
    .eq("client_id", clientId)
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to load notes" }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params;
  const supabase = await createClient();
  const { user, err } = await getProUserAndClient(supabase, clientId);

  if (err === "unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (err === "pro_required") return NextResponse.json({ error: "Pro plan required", upgrade_required: true }, { status: 403 });
  if (err === "not_found") return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const noteBody = (body as { body?: string })?.body;

  if (!noteBody || noteBody.trim().length < 1 || noteBody.trim().length > 2000)
    return NextResponse.json({ error: "body must be 1–2,000 characters" }, { status: 400 });

  const { data, error } = await supabase
    .from("client_notes")
    .insert({ client_id: clientId, user_id: user!.id, body: noteBody.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

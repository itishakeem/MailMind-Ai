import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, user_id, name, email, phone, company, address, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const { data: emails } = await supabase
    .from("emails")
    .select("id, subject, ai_detected_type, status, sent_at, created_at")
    .eq("client_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return NextResponse.json({ client, emails: emails ?? [] });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, phone, company, address } = body as Record<string, string>;

  if (name !== undefined && !name.trim()) {
    return NextResponse.json({ error: "Name cannot be empty", field: "name" }, { status: 400 });
  }
  if (email !== undefined && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email format", field: "email" }, { status: 400 });
  }

  const updates: Record<string, string | null> = {};
  if (name !== undefined) updates.name = name.trim();
  if (email !== undefined) updates.email = email.trim().toLowerCase();
  if (phone !== undefined) updates.phone = phone?.trim() || null;
  if (company !== undefined) updates.company = company?.trim() || null;
  if (address !== undefined) updates.address = address?.trim() || null;

  const { data: updated, error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: "Client not found or update failed" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Client not found or delete failed" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

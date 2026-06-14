import { createClient } from "@/lib/supabase/server";
import { assertPlanLimit, PlanLimitReachedError } from "@/lib/plan-limits";
import { NextResponse, type NextRequest } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch clients with aggregated email stats in one query via Supabase's
  // embedded resource syntax (emails is a foreign-key relation on client_id).
  const { data: clients, error } = await supabase
    .from("clients")
    .select(`
      id, user_id, name, email, phone, company, address, created_at, updated_at,
      emails(id, status, sent_at)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }

  // Compute email_count and last_sent_at from the joined emails
  const enriched = (clients ?? []).map((c) => {
    const emails = (c.emails as { id: string; status: string; sent_at: string | null }[]) ?? [];
    const sentEmails = emails.filter((e) => e.status === "sent");
    const lastSentAt = sentEmails.length
      ? sentEmails.sort((a, b) =>
          new Date(b.sent_at ?? 0).getTime() - new Date(a.sent_at ?? 0).getTime()
        )[0].sent_at
      : null;

    const { emails: _emails, ...clientData } = c as typeof c & { emails: unknown[] };
    void _emails;
    return {
      ...clientData,
      email_count: emails.length,
      last_sent_at: lastSentAt,
    };
  });

  return NextResponse.json({ clients: enriched });
}

export async function POST(request: NextRequest) {
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

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required", field: "name" }, { status: 400 });
  }
  if (!email?.trim() || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email address is required", field: "email" }, { status: 400 });
  }
  if (name.trim().length > 200) {
    return NextResponse.json({ error: "Name must be 200 characters or fewer", field: "name" }, { status: 400 });
  }

  // Enforce Free plan client limit
  try {
    await assertPlanLimit(supabase, user.id, "client_create");
  } catch (err) {
    if (err instanceof PlanLimitReachedError) {
      return NextResponse.json(err.details, { status: 402 });
    }
    return NextResponse.json({ error: "Failed to check plan limits" }, { status: 500 });
  }

  const { data: newClient, error: insertError } = await supabase
    .from("clients")
    .insert({
      user_id: user.id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      company: company?.trim() || null,
      address: address?.trim() || null,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }

  return NextResponse.json(newClient, { status: 201 });
}

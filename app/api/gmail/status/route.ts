import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("gmail_token, gmail_email")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    connected: !!profile?.gmail_token,
    gmail_email: profile?.gmail_email ?? null,
  });
}

import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

// Always returns 200 regardless of whether the email exists (prevents user enumeration).
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = body?.email;

  if (email && typeof email === "string") {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${request.nextUrl.origin}/auth/reset-password`,
    });
  }

  return NextResponse.json({ message: "If this email is registered, a reset link has been sent." });
}

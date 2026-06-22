import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse, type NextRequest } from "next/server";

// Rate limit: 5 reset requests per email per 15 minutes.
// We intentionally return 200 regardless to avoid user enumeration —
// the actual reset email is silently skipped when the limit is exceeded.
const RESET_LIMIT = 5;
const RESET_WINDOW_MS = 15 * 60 * 1000;

// Always returns 200 regardless of whether the email exists (prevents user enumeration).
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : null;

  if (!email) {
    return NextResponse.json(
      { message: "If this email is registered, a reset link has been sent." }
    );
  }

  // Check rate limit — silently skip the actual reset if exceeded
  const { allowed } = rateLimit(
    `password-reset:${email.toLowerCase()}`,
    RESET_LIMIT,
    RESET_WINDOW_MS
  );

  if (allowed) {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${request.nextUrl.origin}/auth/reset-password`,
    });
  } else {
    // Log for observability without leaking to the client
    console.warn(`[password-reset] rate limit exceeded for email hash (not logged)`);
  }

  // Always return the same message to prevent enumeration
  return NextResponse.json({
    message: "If this email is registered, a reset link has been sent.",
  });
}

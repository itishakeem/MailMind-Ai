import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { canAccess, type UserRole } from "@/types";

type Success = { userId: string; role: UserRole; error: null };
type Failure = { userId: null; role: null; error: NextResponse };

/**
 * Verifies the caller is authenticated and has at least `minRole`.
 * Uses the ROLE_HIERARCHY defined in @/types — no schema changes needed
 * when new roles are added.
 */
export async function requireRole(minRole: UserRole): Promise<Success | Failure> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { userId: null, role: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "user") as UserRole;

  if (!canAccess(role, minRole)) {
    return { userId: null, role: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { userId: user.id, role, error: null };
}

import { requireRole } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAccess, type UserRole } from "@/types";
import { NextRequest, NextResponse } from "next/server";

const VALID_PLANS  = ["free", "pro", "business"] as const;
const VALID_ROLES: UserRole[] = ["user", "support", "moderator", "admin", "super_admin"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Minimum required to call this route: moderator (can change plans)
  const { userId: callerId, role: callerRole, error } = await requireRole("moderator");
  if (error) return error;

  const { id: targetId } = await params;
  const body = await req.json().catch(() => ({})) as { plan?: string; role?: string };

  const db = createAdminClient();

  // ── Role change: super_admin only ─────────────────────────────────────
  if (body.role !== undefined) {
    if (!canAccess(callerRole, "super_admin")) {
      return NextResponse.json({ error: "Role changes require super_admin" }, { status: 403 });
    }
    if (targetId === callerId) {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
    }
    const newRole = body.role as UserRole;
    if (!VALID_ROLES.includes(newRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const { error: dbErr } = await db.from("users").update({ role: newRole }).eq("id", targetId);
    if (dbErr) return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ── Plan change: moderator and above ─────────────────────────────────
  if (body.plan !== undefined) {
    if (!VALID_PLANS.includes(body.plan as typeof VALID_PLANS[number])) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    const { error: dbErr } = await db.from("users").update({ plan: body.plan }).eq("id", targetId);
    if (dbErr) return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Minimum required: admin
  const { userId: callerId, role: callerRole, error } = await requireRole("admin");
  if (error) return error;

  const { id: targetId } = await params;

  if (targetId === callerId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const db = createAdminClient();

  // Fetch target's role to prevent lower-privilege deletes
  const { data: target } = await db
    .from("users")
    .select("role")
    .eq("id", targetId)
    .single();

  const targetRole = (target?.role ?? "user") as UserRole;

  // Deleting an admin or super_admin requires super_admin
  if (canAccess(targetRole, "admin") && !canAccess(callerRole, "super_admin")) {
    return NextResponse.json(
      { error: "Deleting admin-level accounts requires super_admin" },
      { status: 403 }
    );
  }

  await db.from("emails").delete().eq("user_id", targetId);
  await db.from("clients").delete().eq("user_id", targetId);
  await db.from("agent_message_logs").delete().eq("user_id", targetId);
  await db.from("users").delete().eq("id", targetId);
  await db.auth.admin.deleteUser(targetId);

  return NextResponse.json({ success: true });
}

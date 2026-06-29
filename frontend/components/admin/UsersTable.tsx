"use client";

import { useState } from "react";
import { canAccess, type AdminUserRow, type Plan, type UserRole } from "@/types";

interface Props {
  users: AdminUserRow[];
  callerId: string;
  viewerRole: UserRole;
  onPlanChange: (id: string, plan: Plan) => Promise<void>;
  onRoleChange: (id: string, role: UserRole) => Promise<void>;
  onDelete: (id: string, name: string) => void;
}

// ── Role config ─────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<UserRole, { label: string; bg: string; text: string }> = {
  user:        { label: "User",        bg: "rgba(107,114,128,0.1)", text: "#6b7280" },
  support:     { label: "Support",     bg: "rgba(59,130,246,0.1)",  text: "#3b82f6" },
  moderator:   { label: "Moderator",   bg: "rgba(16,185,129,0.1)",  text: "#10b981" },
  admin:       { label: "Admin",       bg: "rgba(139,92,246,0.1)",  text: "#7c3aed" },
  super_admin: { label: "Super Admin", bg: "rgba(245,158,11,0.1)",  text: "#d97706" },
};

const ALL_ROLES: UserRole[] = ["user", "support", "moderator", "admin", "super_admin"];

const PLAN_COLORS: Record<Plan, { bg: string; text: string }> = {
  free:     { bg: "rgba(99,102,241,0.1)",  text: "#6366f1" },
  pro:      { bg: "rgba(139,92,246,0.1)",  text: "#7c3aed" },
  business: { bg: "rgba(245,158,11,0.1)",  text: "#d97706" },
};

// ── Inline dropdown ──────────────────────────────────────────────────────────
function InlineDropdown<T extends string>({
  current,
  options,
  getLabel,
  getStyle,
  onChange,
  disabled = false,
}: {
  current: T;
  options: T[];
  getLabel: (v: T) => string;
  getStyle: (v: T) => { bg: string; text: string };
  onChange: (v: T) => Promise<void>;
  disabled?: boolean;
}) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);

  async function pick(v: T) {
    if (v === current) { setOpen(false); return; }
    setLoading(true); setOpen(false);
    await onChange(v);
    setLoading(false);
  }

  const s = getStyle(current);
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={disabled || loading}
        className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50"
        style={{ background: s.bg, color: s.text }}
      >
        {loading ? "…" : getLabel(current)}
        {!disabled && (
          <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-20 rounded-xl overflow-hidden py-1"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)", minWidth: "130px" }}
        >
          {options.map(v => {
            const vs = getStyle(v);
            return (
              <button
                key={v}
                onClick={() => pick(v)}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors hover:opacity-80"
                style={{ color: vs.text }}
              >
                {v === current && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: vs.text }} />}
                {getLabel(v)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Main component ───────────────────────────────────────────────────────────
export default function UsersTable({ users, callerId, viewerRole, onPlanChange, onRoleChange, onDelete }: Props) {
  const canChangePlan   = canAccess(viewerRole, "moderator");
  const canChangeRoles  = canAccess(viewerRole, "super_admin");
  const canDeleteUsers  = canAccess(viewerRole, "admin");

  if (users.length === 0) {
    return (
      <div className="py-16 text-center" style={{ color: "var(--text-3)" }}>
        <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-sm">No users found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["User", "Plan", "Role", "Gmail", "Joined", "Actions"].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map(u => {
            const isSelf        = u.id === callerId;
            const targetIsAdmin = canAccess(u.role, "admin");

            return (
              <tr
                key={u.id}
                className="transition-colors"
                style={{ borderBottom: "1px solid var(--border)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.02)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {/* User */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: isSelf ? "linear-gradient(135deg,#ef4444,#dc2626)" : "var(--a-gradient)" }}
                      title={isSelf ? "You" : undefined}
                    >
                      {initials(u.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate" style={{ color: "var(--text-1)" }}>
                        {u.name}{isSelf && <span className="ml-1.5 text-[10px] font-bold" style={{ color: "var(--text-3)" }}>(you)</span>}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>{u.email}</p>
                    </div>
                  </div>
                </td>

                {/* Plan */}
                <td className="px-4 py-3">
                  {canChangePlan ? (
                    <InlineDropdown
                      current={u.plan}
                      options={["free", "pro", "business"] as Plan[]}
                      getLabel={v => v.charAt(0).toUpperCase() + v.slice(1)}
                      getStyle={v => PLAN_COLORS[v]}
                      onChange={plan => onPlanChange(u.id, plan)}
                    />
                  ) : (
                    <span className="rounded-lg px-2.5 py-1 text-xs font-bold"
                      style={{ background: PLAN_COLORS[u.plan].bg, color: PLAN_COLORS[u.plan].text }}>
                      {u.plan.charAt(0).toUpperCase() + u.plan.slice(1)}
                    </span>
                  )}
                </td>

                {/* Role */}
                <td className="px-4 py-3">
                  {canChangeRoles && !isSelf ? (
                    <InlineDropdown
                      current={u.role}
                      options={ALL_ROLES}
                      getLabel={v => ROLE_CONFIG[v]?.label ?? v}
                      getStyle={v => ({ bg: ROLE_CONFIG[v]?.bg ?? "", text: ROLE_CONFIG[v]?.text ?? "" })}
                      onChange={role => onRoleChange(u.id, role)}
                    />
                  ) : (
                    <span className="rounded-lg px-2.5 py-1 text-xs font-bold"
                      style={{ background: ROLE_CONFIG[u.role]?.bg ?? "", color: ROLE_CONFIG[u.role]?.text ?? "" }}>
                      {ROLE_CONFIG[u.role]?.label ?? u.role}
                    </span>
                  )}
                </td>

                {/* Gmail */}
                <td className="px-4 py-3">
                  {u.gmail_email ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium rounded-lg px-2 py-0.5"
                      style={{ background: "rgba(16,185,129,0.1)", color: "#059669" }}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Connected
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--text-3)" }}>—</span>
                  )}
                </td>

                {/* Joined */}
                <td className="px-4 py-3 text-xs" style={{ color: "var(--text-3)" }}>
                  {formatDate(u.created_at)}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  {canDeleteUsers && !isSelf && !(targetIsAdmin && !canAccess(viewerRole, "super_admin")) && (
                    <button
                      onClick={() => onDelete(u.id, u.name)}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all hover:opacity-80"
                      style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

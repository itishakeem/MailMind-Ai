"use client";

import { useCallback, useEffect, useState } from "react";
import UsersTable from "@/components/admin/UsersTable";
import { useAdmin } from "@/components/admin/AdminContext";
import type { AdminUserRow, Plan, UserRole } from "@/types";
import { useToast } from "@/components/ui/Toast";

const PLANS = ["all", "free", "pro", "business"] as const;

export default function AdminUsersPage() {
  const toast = useToast();
  const { userId: callerId, role: viewerRole } = useAdmin();
  const [users,   setUsers]   = useState<AdminUserRow[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [plan,    setPlan]    = useState<string>("all");
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const perPage = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (plan !== "all") params.set("plan", plan);

    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, search, plan]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Debounce search
  useEffect(() => {
    setPage(1);
  }, [search, plan]);

  async function handlePlanChange(id: string, newPlan: Plan) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: newPlan }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, plan: newPlan } : u));
      toast.success("Plan updated");
    } else {
      toast.error("Failed to update plan");
    }
  }

  async function handleRoleChange(id: string, newRole: UserRole) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
      toast.success("Role updated");
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "Failed to update role");
    }
  }

  async function handleDeleteConfirm() {
    if (!confirm) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/users/${confirm.id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== confirm.id));
      setTotal(t => t - 1);
      toast.success(`${confirm.name} deleted`);
    } else {
      toast.error("Failed to delete user");
    }
    setConfirm(null);
    setDeleting(false);
  }

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--text-1)" }}>Users</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
          Manage all {total.toLocaleString()} platform accounts
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-3)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-2)",
              color: "var(--text-1)",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "var(--a-to)")}
            onBlur={e => (e.currentTarget.style.borderColor = "var(--border-2)")}
          />
        </div>

        <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          {PLANS.map(p => (
            <button
              key={p}
              onClick={() => { setPlan(p); setPage(1); }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
              style={
                plan === p
                  ? { background: "var(--a-gradient)", color: "#fff" }
                  : { color: "var(--text-2)" }
              }
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden animate-fade-in-up"
        style={{ animationDelay: "120ms", background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full animate-pulse flex-shrink-0" style={{ background: "rgba(0,0,0,0.07)" }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-36 rounded animate-pulse" style={{ background: "rgba(0,0,0,0.07)" }} />
                  <div className="h-2.5 w-52 rounded animate-pulse" style={{ background: "rgba(0,0,0,0.04)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <UsersTable
            users={users}
            callerId={callerId}
            viewerRole={viewerRole}
            onPlanChange={handlePlanChange}
            onRoleChange={handleRoleChange}
            onDelete={(id, name) => setConfirm({ id, name })}
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between animate-fade-in-up" style={{ animationDelay: "180ms" }}>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-2)" }}
            >
              ← Prev
            </button>
            <span className="text-xs font-medium" style={{ color: "var(--text-2)" }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-2)" }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 animate-fade-in"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(239,68,68,0.1)" }}>
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-center mb-2" style={{ color: "var(--text-1)" }}>Delete User</h3>
            <p className="text-sm text-center mb-6" style={{ color: "var(--text-2)" }}>
              Delete <strong>{confirm.name}</strong>? This will permanently remove their account, emails, and clients.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

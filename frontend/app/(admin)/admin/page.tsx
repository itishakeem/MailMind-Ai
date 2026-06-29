"use client";

import { useEffect, useState } from "react";
import AdminStatCard from "@/components/admin/AdminStatCard";
import PlanDistributionChart from "@/components/admin/PlanDistributionChart";
import EmailVolumeChart from "@/components/admin/EmailVolumeChart";
import { ROLE_HIERARCHY, type AdminOverviewStats, type UserRole } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

const PLAN_COLOR: Record<string, { bg: string; text: string }> = {
  free:     { bg: "rgba(99,102,241,0.1)",  text: "#6366f1" },
  pro:      { bg: "rgba(139,92,246,0.1)",  text: "#7c3aed" },
  business: { bg: "rgba(245,158,11,0.1)",  text: "#d97706" },
};

const ROLE_COLOR: Record<UserRole, { bg: string; text: string }> = {
  user:        { bg: "rgba(107,114,128,0.1)", text: "#6b7280" },
  support:     { bg: "rgba(59,130,246,0.1)",  text: "#3b82f6" },
  moderator:   { bg: "rgba(16,185,129,0.1)",  text: "#10b981" },
  admin:       { bg: "rgba(139,92,246,0.1)",  text: "#7c3aed" },
  super_admin: { bg: "rgba(245,158,11,0.1)",  text: "#d97706" },
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statCards = [
    {
      title: "Total Users",
      value: stats?.total_users ?? 0,
      subtitle: `+${stats?.new_users_this_month ?? 0} this month`,
      color: "from-violet-500 to-purple-600",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: "Emails Sent (Month)",
      value: stats?.emails_sent_this_month ?? 0,
      subtitle: `${stats?.total_emails ?? 0} total all time`,
      color: "from-blue-500 to-blue-600",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: "Scheduled Emails",
      value: stats?.emails_scheduled ?? 0,
      subtitle: `${stats?.emails_failed ?? 0} failed total`,
      color: "from-amber-400 to-orange-500",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Gmail Connections",
      value: stats?.gmail_connections ?? 0,
      subtitle: `of ${stats?.total_users ?? 0} users`,
      color: "from-emerald-400 to-teal-500",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
    {
      title: "Total Clients",
      value: stats?.total_clients ?? 0,
      subtitle: "Across all accounts",
      color: "from-sky-400 to-cyan-500",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      title: "Contact Messages",
      value: stats?.contact_messages ?? 0,
      subtitle: "Via contact form",
      color: "from-rose-400 to-red-500",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page header */}
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--text-1)" }}>Platform Overview</h1>
          <span
            className="rounded-lg px-2 py-0.5 text-xs font-bold"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            LIVE
          </span>
        </div>
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          Real-time platform health, user metrics, and system statistics.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <div key={card.title} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
            <AdminStatCard
              title={card.title}
              value={loading ? 0 : card.value}
              subtitle={loading ? undefined : card.subtitle}
              loading={loading}
              color={card.color}
              icon={card.icon}
            />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: "360ms" }}>
          {loading ? (
            <div className="rounded-2xl p-6 h-48 animate-pulse" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }} />
          ) : (
            <PlanDistributionChart data={stats?.users_by_plan ?? { free: 0, pro: 0, business: 0 }} />
          )}
        </div>
        <div className="lg:col-span-3 animate-fade-in-up" style={{ animationDelay: "420ms" }}>
          {/* Mini email volume using last month stats as placeholder */}
          {!loading && (
            <div className="rounded-2xl p-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
              <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-1)" }}>Quick Stats</h3>
              <p className="text-xs mb-5" style={{ color: "var(--text-3)" }}>Plan breakdown at a glance</p>
              <div className="space-y-3">
                {[
                  { label: "Free users",     count: stats?.users_by_plan.free ?? 0,     total: stats?.total_users ?? 1, color: "#6366f1" },
                  { label: "Pro users",      count: stats?.users_by_plan.pro ?? 0,      total: stats?.total_users ?? 1, color: "#7c3aed" },
                  { label: "Business users", count: stats?.users_by_plan.business ?? 0, total: stats?.total_users ?? 1, color: "#d97706" },
                  { label: "Gmail connected", count: stats?.gmail_connections ?? 0,     total: stats?.total_users ?? 1, color: "#10b981" },
                ].map(row => {
                  const pct = stats?.total_users ? Math.round((row.count / row.total) * 100) : 0;
                  return (
                    <div key={row.label}>
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span style={{ color: "var(--text-2)" }}>{row.label}</span>
                        <span className="font-bold" style={{ color: "var(--text-1)" }}>{row.count} <span style={{ color: "var(--text-3)", fontWeight: 400 }}>({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: row.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent signups */}
      <div className="rounded-2xl animate-fade-in-up" style={{ animationDelay: "480ms", background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--text-1)" }}>Recent Signups</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>Latest users to join the platform</p>
          </div>
          <a href="/admin/users" className="text-sm font-semibold" style={{ color: "var(--a-to)" }}>
            View all →
          </a>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="px-6 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full animate-pulse" style={{ background: "rgba(0,0,0,0.07)" }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 rounded animate-pulse" style={{ background: "rgba(0,0,0,0.07)" }} />
                  <div className="h-2.5 w-48 rounded animate-pulse" style={{ background: "rgba(0,0,0,0.04)" }} />
                </div>
              </div>
            ))
          ) : (
            (stats?.recent_users ?? []).map(u => {
              const pc = PLAN_COLOR[u.plan] ?? PLAN_COLOR.free;
              const role = (u.role ?? "user") as UserRole;
              const rc = ROLE_COLOR[role];
              const isStaff = (ROLE_HIERARCHY[role] ?? 0) >= ROLE_HIERARCHY.support;
              return (
                <div key={u.id} className="px-6 py-4 flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: isStaff ? "linear-gradient(135deg,#ef4444,#dc2626)" : "var(--a-gradient)" }}
                  >
                    {initials(u.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{u.name}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isStaff && (
                      <span className="rounded-lg px-2 py-0.5 text-xs font-bold" style={{ background: rc.bg, color: rc.text }}>
                        {role.replace("_", " ")}
                      </span>
                    )}
                    <span className="rounded-lg px-2 py-0.5 text-xs font-bold" style={{ background: pc.bg, color: pc.text }}>
                      {u.plan}
                    </span>
                    <span className="text-xs hidden sm:block" style={{ color: "var(--text-3)" }}>
                      {formatDate(u.created_at)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

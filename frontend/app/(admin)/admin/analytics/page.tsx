"use client";

import { useEffect, useState } from "react";
import EmailVolumeChart from "@/components/admin/EmailVolumeChart";
import type { AdminAnalytics } from "@/types";

const TYPE_LABELS: Record<string, string> = {
  invoice:          "Invoice",
  payment_reminder: "Payment Reminder",
  project_update:   "Project Update",
  proposal:         "Proposal",
  manual:           "Manual",
};

const TYPE_COLORS = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#3b82f6"];

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5 text-sm">
        <span className="font-medium" style={{ color: "var(--text-1)" }}>{label}</span>
        <span className="font-bold tabular-nums" style={{ color: "var(--text-1)" }}>
          {count.toLocaleString()} <span className="text-xs font-normal" style={{ color: "var(--text-3)" }}>({pct}%)</span>
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data,    setData]    = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalEmails = data
    ? data.status_breakdown.sent + data.status_breakdown.failed + data.status_breakdown.scheduled + data.status_breakdown.draft
    : 0;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--text-1)" }}>Analytics</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Platform-wide email statistics and usage patterns.</p>
      </div>

      {/* Email volume chart */}
      <div className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        {loading ? (
          <div className="rounded-2xl p-6 h-56 animate-pulse" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }} />
        ) : (
          <EmailVolumeChart
            data={data?.daily_volume ?? []}
            title="Email Volume"
            subtitle="Sent vs. failed — last 30 days"
          />
        )}
      </div>

      {/* Status breakdown + Type distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status breakdown */}
        <div
          className="rounded-2xl p-6 animate-fade-in-up"
          style={{ animationDelay: "120ms", background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <h2 className="text-base font-bold mb-1" style={{ color: "var(--text-1)" }}>Email Status Breakdown</h2>
          <p className="text-xs mb-5" style={{ color: "var(--text-3)" }}>{totalEmails.toLocaleString()} total emails on the platform</p>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3.5 w-32 rounded animate-pulse" style={{ background: "rgba(0,0,0,0.07)" }} />
                  <div className="h-2 rounded-full animate-pulse" style={{ background: "rgba(0,0,0,0.05)" }} />
                </div>
              ))}
            </div>
          ) : (
            <>
              <StatusBar label="Sent"      count={data?.status_breakdown.sent ?? 0}      total={totalEmails} color="#10b981" />
              <StatusBar label="Scheduled" count={data?.status_breakdown.scheduled ?? 0} total={totalEmails} color="#f59e0b" />
              <StatusBar label="Failed"    count={data?.status_breakdown.failed ?? 0}    total={totalEmails} color="#ef4444" />
              <StatusBar label="Draft"     count={data?.status_breakdown.draft ?? 0}     total={totalEmails} color="#6b7280" />
            </>
          )}
        </div>

        {/* Email type distribution */}
        <div
          className="rounded-2xl p-6 animate-fade-in-up"
          style={{ animationDelay: "180ms", background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <h2 className="text-base font-bold mb-1" style={{ color: "var(--text-1)" }}>Email Type Distribution</h2>
          <p className="text-xs mb-5" style={{ color: "var(--text-3)" }}>AI-detected email categories</p>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: "rgba(0,0,0,0.05)" }} />
              ))}
            </div>
          ) : (data?.type_distribution?.length ?? 0) === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--text-3)" }}>No AI-typed emails yet</p>
          ) : (
            <div className="space-y-3">
              {(data?.type_distribution ?? []).map((t, i) => {
                const color = TYPE_COLORS[i % TYPE_COLORS.length];
                const totalTypes = data?.type_distribution.reduce((s, x) => s + x.count, 0) ?? 1;
                const pct = Math.round((t.count / totalTypes) * 100);
                return (
                  <div key={t.type} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5 text-xs">
                        <span className="font-medium" style={{ color: "var(--text-1)" }}>
                          {TYPE_LABELS[t.type] ?? t.type}
                        </span>
                        <span className="font-bold" style={{ color: "var(--text-1)" }}>{t.count} <span style={{ color: "var(--text-3)", fontWeight: 400 }}>({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top users */}
      <div
        className="rounded-2xl animate-fade-in-up"
        style={{ animationDelay: "240ms", background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="px-6 pt-5 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-base font-bold" style={{ color: "var(--text-1)" }}>Top Users by Email Volume</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>Most active senders on the platform</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Rank", "User", "Email", "Emails Sent"].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-6 py-4" colSpan={4}>
                      <div className="h-4 rounded animate-pulse" style={{ background: "rgba(0,0,0,0.05)" }} />
                    </td>
                  </tr>
                ))
              ) : (data?.top_users ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm" style={{ color: "var(--text-3)" }}>
                    No sent emails yet
                  </td>
                </tr>
              ) : (
                (data?.top_users ?? []).map((u, i) => (
                  <tr key={u.user_id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-6 py-3.5">
                      <span
                        className="w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold"
                        style={i < 3
                          ? { background: ["rgba(245,158,11,0.15)","rgba(156,163,175,0.15)","rgba(180,83,9,0.15)"][i], color: ["#d97706","#6b7280","#92400e"][i] }
                          : { color: "var(--text-3)" }
                        }
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-medium" style={{ color: "var(--text-1)" }}>{u.name}</td>
                    <td className="px-6 py-3.5 text-xs" style={{ color: "var(--text-3)" }}>{u.email}</td>
                    <td className="px-6 py-3.5">
                      <span className="font-bold tabular-nums" style={{ color: "var(--text-1)" }}>{u.email_count.toLocaleString()}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

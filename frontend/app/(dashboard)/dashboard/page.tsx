"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import StatCard from "@/components/dashboard/StatCard";
import ClientActivityTable from "@/components/dashboard/ClientActivityTable";
import EmailActivityChart from "@/components/dashboard/EmailActivityChart";
import GmailConnectBanner from "@/components/ui/GmailConnectBanner";
import ProBadge from "@/components/ui/ProBadge";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import type { DashboardStats } from "@/types";

/* ── Circular progress ring ────────────────────────────────────────── */
function CircularProgress({
  pct,
  color,
  size = 80,
  stroke = 8,
}: {
  pct: number;
  color: string;
  size?: number;
  stroke?: number;
}) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  const c    = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
      <circle
        cx={c} cy={c} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${c} ${c})`}
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)" }}
      />
    </svg>
  );
}

function PlanUsageSection({ stats }: { stats: DashboardStats }) {
  if (stats.plan !== "free") return null;

  const emailPct  = stats.plan_usage?.emails_limit
    ? Math.round((stats.plan_usage.emails_used / stats.plan_usage.emails_limit) * 100)
    : 0;
  const clientPct = stats.plan_usage?.clients_limit
    ? Math.round((stats.plan_usage.clients_used / stats.plan_usage.clients_limit) * 100)
    : 0;

  const emailColor  = emailPct  >= 90 ? "#ef4444" : emailPct  >= 70 ? "#f59e0b" : "#3b82f6";
  const clientColor = clientPct >= 90 ? "#ef4444" : clientPct >= 70 ? "#f59e0b" : "#10b981";

  return (
    <div
      className="bg-white rounded-2xl p-6 animate-fade-in-up"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", animationDelay: "200ms" }}
    >
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">Free Plan Usage</h2>
          <p className="text-xs text-gray-400 mt-0.5">Your monthly limits at a glance</p>
        </div>
        <Link
          href="/#pricing"
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all hover:-translate-y-0.5"
          style={{ background: "var(--a-gradient)", boxShadow: "0 4px 14px rgba(79,70,229,0.35)" }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Upgrade to Pro
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Emails ring */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <CircularProgress pct={emailPct} color={emailColor} size={100} stroke={10} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-gray-900">{emailPct}%</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900">Emails</p>
            <p className="text-xs text-gray-400">
              {stats.plan_usage?.emails_used} / {stats.plan_usage?.emails_limit} used
            </p>
          </div>
        </div>

        {/* Clients ring */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <CircularProgress pct={clientPct} color={clientColor} size={100} stroke={10} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-gray-900">{clientPct}%</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900">Clients</p>
            <p className="text-xs text-gray-400">
              {stats.plan_usage?.clients_used} / {stats.plan_usage?.clients_limit} used
            </p>
          </div>
        </div>
      </div>

      {(emailPct >= 80 || clientPct >= 80) && (
        <div
          className="mt-5 rounded-xl px-4 py-3 text-xs font-medium animate-fade-in"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "#b45309" }}
        >
          You&apos;re approaching your plan limit. Upgrade to Pro for unlimited emails and clients.
        </div>
      )}
    </div>
  );
}

/* ── Stat card config ──────────────────────────────────────────── */
const STAT_ICONS = {
  emails: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  scheduled: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  clients: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  plan: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

function FadeSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (searchParams.get("gmail") === "connected") {
      toast.success("Gmail connected! You can now send emails from your account.");
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams, toast]);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const planUsageLabel =
    stats?.plan === "free"
      ? `${stats.plan_usage?.emails_used} / ${stats.plan_usage?.emails_limit} emails used`
      : "Unlimited";

  return (
    <div className="space-y-6">
      {/* Gmail banner */}
      <FadeSection delay={0}>
        <GmailConnectBanner />
      </FadeSection>

      {/* Header */}
      <FadeSection delay={80}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold text-gray-900">
                {stats?.user_name ? `Welcome back, ${stats.user_name.split(" ")[0]} 👋` : "Dashboard"}
              </h1>
              {stats?.plan && <ProBadge plan={stats.plan} size="md" />}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Your email activity overview for this month.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {stats?.plan === "free" && (
              <Link
                href="/#pricing"
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.3)",
                  color: "var(--a-to)",
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Upgrade
              </Link>
            )}
            {(stats?.plan === "pro" || stats?.plan === "business") && (
              <a
                href="/api/export/emails"
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  color: "#059669",
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </a>
            )}
            <Link
              href="/compose"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              style={{
                background: "var(--a-gradient)",
                boxShadow: "0 4px 14px rgba(79,70,229,0.35)",
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Quick Compose
            </Link>
          </div>
        </div>
      </FadeSection>

      {/* Stat cards */}
      <FadeSection delay={160}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Emails Sent"
            value={stats?.emails_sent_this_month ?? 0}
            subtitle="This month"
            loading={loading}
            icon={STAT_ICONS.emails}
            accentGradient="from-blue-500 to-blue-600"
          />
          <StatCard
            title="Scheduled"
            value={stats?.scheduled_count ?? 0}
            subtitle="Pending delivery"
            loading={loading}
            icon={STAT_ICONS.scheduled}
            accentGradient="from-amber-400 to-orange-500"
          />
          <StatCard
            title="Clients"
            value={stats?.plan_usage?.clients_used ?? 0}
            subtitle={
              stats?.plan === "free"
                ? `${stats.plan_usage?.clients_used} / ${stats.plan_usage?.clients_limit} on free plan`
                : "Unlimited"
            }
            loading={loading}
            icon={STAT_ICONS.clients}
            accentGradient="from-emerald-400 to-teal-500"
          />
          <StatCard
            title="Plan Usage"
            value={loading ? "—" : stats?.plan === "free" ? `${stats.plan_usage?.emails_used} / ${stats.plan_usage?.emails_limit}` : "∞"}
            subtitle={loading ? undefined : planUsageLabel}
            loading={loading}
            icon={STAT_ICONS.plan}
            accentGradient="from-violet-500 to-purple-600"
          />
        </div>
      </FadeSection>

      {/* 7-day email activity chart */}
      <FadeSection delay={200}>
        {loading ? (
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            <div className="h-5 w-40 rounded-lg mb-1 animate-pulse" style={{ background: "rgba(0,0,0,0.06)" }} />
            <div className="h-3 w-28 rounded mb-5 animate-pulse" style={{ background: "rgba(0,0,0,0.04)" }} />
            <div className="h-40 rounded-xl animate-pulse" style={{ background: "rgba(0,0,0,0.04)" }} />
          </div>
        ) : (
          <EmailActivityChart data={stats?.daily_emails ?? []} />
        )}
      </FadeSection>

      {/* Plan usage rings — free plan only */}
      {stats && stats.plan === "free" && (
        <FadeSection delay={260}>
          <PlanUsageSection stats={stats} />
        </FadeSection>
      )}

      {/* Client activity */}
      <FadeSection delay={320}>
        <div
          className="rounded-2xl"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <div>
              <h2 className="text-base font-bold text-gray-900">Client Activity</h2>
              <p className="text-xs text-gray-400 mt-0.5">Emails sent per client this month</p>
            </div>
            <Link
              href="/clients"
              className="text-sm font-semibold transition-colors"
              style={{ color: "var(--a-to)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#4338ca")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--a-to)")}
            >
              View all →
            </Link>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} variant="text" className="h-5" />
                ))}
              </div>
            ) : (
              <ClientActivityTable activity={stats?.per_client_activity ?? []} />
            )}
          </div>
        </div>
      </FadeSection>

    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}

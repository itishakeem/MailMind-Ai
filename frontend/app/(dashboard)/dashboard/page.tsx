"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import StatCard from "@/components/dashboard/StatCard";
import ClientActivityTable from "@/components/dashboard/ClientActivityTable";
import MonthlySummary from "@/components/dashboard/MonthlySummary";
import GmailConnectBanner from "@/components/ui/GmailConnectBanner";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import type { DashboardStats } from "@/types";

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
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const planUsageLabel =
    stats?.plan === "free"
      ? `${stats.plan_usage.emails_used} / ${stats.plan_usage.emails_limit} emails used`
      : "Unlimited";

  return (
    <div className="space-y-6">
      {/* Gmail banner */}
      <FadeSection delay={0}>
        <GmailConnectBanner />
      </FadeSection>

      {/* Header */}
      <FadeSection delay={80}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Your email activity overview for this month.
            </p>
          </div>
          <Link
            href="/compose"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg,#2563eb,#4f46e5)",
              boxShadow: "0 4px 14px rgba(79,70,229,0.35)",
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Quick Compose
          </Link>
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
            value={stats?.plan_usage.clients_used ?? 0}
            subtitle={
              stats?.plan === "free"
                ? `${stats.plan_usage.clients_used} / ${stats.plan_usage.clients_limit} on free plan`
                : "Unlimited"
            }
            loading={loading}
            icon={STAT_ICONS.clients}
            accentGradient="from-emerald-400 to-teal-500"
          />
          <StatCard
            title="Plan Usage"
            value={loading ? "—" : stats?.plan === "free" ? `${stats.plan_usage.emails_used} / ${stats.plan_usage.emails_limit}` : "∞"}
            subtitle={loading ? undefined : planUsageLabel}
            loading={loading}
            icon={STAT_ICONS.plan}
            accentGradient="from-violet-500 to-purple-600"
          />
        </div>
      </FadeSection>

      {/* Client activity */}
      <FadeSection delay={240}>
        <div
          className="bg-white rounded-2xl"
          style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <div>
              <h2 className="text-base font-bold text-gray-900">Client Activity</h2>
              <p className="text-xs text-gray-400 mt-0.5">Emails sent per client this month</p>
            </div>
            <Link
              href="/clients"
              className="text-sm font-semibold transition-colors"
              style={{ color: "#4f46e5" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#4338ca")}
              onMouseLeave={e => (e.currentTarget.style.color = "#4f46e5")}
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

      {/* AI Monthly Summary */}
      <FadeSection delay={320}>
        <MonthlySummary />
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

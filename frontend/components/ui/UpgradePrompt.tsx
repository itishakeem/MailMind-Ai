"use client";

import { useEffect, useState } from "react";
import type { PlanLimitError } from "@/types";

export default function UpgradePrompt() {
  const [details,   setDetails]   = useState<PlanLimitError | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  async function handleUpgrade() {
    setUpgrading(true);
    const res  = await fetch("/api/payments/checkout", { method: "POST" });
    const data = await res.json();
    setUpgrading(false);
    if (data.url) window.location.href = data.url;
  }

  useEffect(() => {
    function handler(e: Event) {
      const data = (e as CustomEvent<PlanLimitError>).detail;
      setDetails(data);
    }
    window.addEventListener("plan-limit-reached", handler);
    return () => window.removeEventListener("plan-limit-reached", handler);
  }, []);

  if (!details) return null;

  const isEmailLimit = details.limit_type === "emails_per_month";
  const limitLabel   = isEmailLimit ? "emails this month" : "clients";
  const pct          = Math.round((details.current_count / details.max_allowed) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) setDetails(null); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden animate-scale-in"
        style={{
          background: "#111118",
          border: "1px solid rgba(99,102,241,0.35)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), 0 0 48px rgba(99,102,241,0.15)",
        }}
      >
        {/* Top gradient bar */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#2563eb,#4f46e5,#7c3aed)" }} />

        <div className="p-6">
          {/* Icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}
          >
            <svg className="w-7 h-7" fill="none" stroke="#818cf8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          <h2 className="text-center text-lg font-bold mb-1" style={{ color: "#F8F8FF" }}>
            Plan Limit Reached
          </h2>
          <p className="text-center text-sm mb-5" style={{ color: "#9CA3AF" }}>
            You&apos;ve used <span style={{ color: "#818cf8", fontWeight: 700 }}>{details.current_count}</span> of your{" "}
            <span style={{ color: "#818cf8", fontWeight: 700 }}>{details.max_allowed}</span> allowed {limitLabel} on the free plan.
          </p>

          {/* Usage bar */}
          <div className="mb-5">
            <div className="flex justify-between text-xs mb-1.5" style={{ color: "#6B7280" }}>
              <span>Usage</span>
              <span style={{ color: pct >= 100 ? "#ef4444" : "#818cf8" }}>{pct}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  background: pct >= 100
                    ? "linear-gradient(90deg,#ef4444,#dc2626)"
                    : "linear-gradient(90deg,#2563eb,#4f46e5)",
                }}
              />
            </div>
          </div>

          {/* What you get with Pro */}
          <div
            className="rounded-xl p-3.5 mb-5"
            style={{ background: "rgba(79,70,229,0.1)", border: "1px solid rgba(79,70,229,0.2)" }}
          >
            <p className="text-xs font-bold text-indigo-300 mb-2">Pro plan includes:</p>
            <ul className="space-y-1.5">
              {["Unlimited emails every month", "Unlimited clients", "PDF upload & AI detection", "Scheduled delivery"].map(f => (
                <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                  <svg className="w-3.5 h-3.5 shrink-0 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 animate-btn-glow"
              style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {upgrading ? "Opening checkout…" : "Upgrade to Pro — $9.99/month"}
            </button>
            <button
              onClick={() => setDetails(null)}
              className="text-sm transition-colors py-1"
              style={{ color: "rgba(255,255,255,0.3)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

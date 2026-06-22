"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Plan } from "@/types";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/compose",
    label: "Compose",
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    href: "/clients",
    label: "Clients",
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: "/scheduled",
    label: "Scheduled",
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const PLAN_LABEL: Record<Plan, string> = {
  free: "Free Plan",
  pro: "Pro Plan",
  business: "Business",
};

export default function Sidebar({
  onNavClick,
  plan = "free",
}: {
  onNavClick?: () => void;
  plan?: Plan;
} = {}) {
  const pathname = usePathname();
  const [upgrading, setUpgrading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);

  function handleUpgrade() {
    setComingSoon(true);
    setTimeout(() => setComingSoon(false), 3500);
  }

  function handleManagePlan() {
    setComingSoon(true);
    setTimeout(() => setComingSoon(false), 3500);
  }

  return (
    <aside
      className="w-56 shrink-0 flex flex-col py-5"
      style={{ background: "#0f172a", borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Logo row */}
      <div className="mb-6 px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-extrabold text-white transition-transform group-hover:scale-105 animate-logo-glow"
            style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}
          >
            M
          </div>
          <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">
            MailMind AI
          </span>
        </Link>
      </div>

      {/* Label */}
      <div className="px-4 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.22)" }}>
          Navigation
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative"
              style={
                isActive
                  ? {
                      background: "linear-gradient(90deg, rgba(37,99,235,0.28), rgba(79,70,229,0.22))",
                      color: "#fff",
                      borderLeft: "2px solid #4f46e5",
                      boxShadow: "inset 0 0 20px rgba(99,102,241,0.18), 0 0 14px rgba(99,102,241,0.1)",
                    }
                  : {
                      color: "rgba(255,255,255,0.45)",
                      borderLeft: "2px solid transparent",
                    }
              }
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.8)";
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.45)";
                }
              }}
            >
              <span
                className={`transition-transform duration-150 group-hover:scale-110 ${isActive ? "animate-icon-glow" : ""}`}
                style={isActive ? { color: "#818cf8", borderRadius: "6px" } : {}}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Plan CTA box */}
      <div className="mx-3 mt-4 px-1">
        {plan === "free" ? (
          <div
            className="rounded-xl p-3.5 animate-fade-in"
            style={{ background: "rgba(79,70,229,0.13)", border: "1px solid rgba(79,70,229,0.28)" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-indigo-300">Free Plan</span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                style={{ background: "rgba(79,70,229,0.3)", color: "#a5b4fc" }}
              >
                LIMITED
              </span>
            </div>
            <p className="text-[11px] leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.38)" }}>
              10 emails · 3 clients per month
            </p>
            {comingSoon ? (
              <p className="rounded-lg py-2 text-center text-[10px] font-semibold animate-fade-in" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24" }}>
                Coming Soon
              </p>
            ) : (
              <button
                onClick={() => { onNavClick?.(); handleUpgrade(); }}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold text-white transition-all animate-btn-glow"
                style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Upgrade to Pro
              </button>
            )}
          </div>
        ) : (
          <div
            className="rounded-xl p-3.5 animate-badge-glow"
            style={{ background: "rgba(79,70,229,0.15)", border: "1px solid rgba(99,102,241,0.4)" }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-bold" style={{ color: "#818cf8" }}>⚡ {PLAN_LABEL[plan]}</span>
            </div>
            <p className="text-[11px] mb-2.5" style={{ color: "rgba(255,255,255,0.38)" }}>
              Unlimited emails &amp; clients
            </p>
            {comingSoon ? (
              <p className="rounded-lg py-1.5 text-center text-[10px] font-semibold animate-fade-in" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24" }}>
                Coming Soon
              </p>
            ) : (
              <button
                onClick={() => { onNavClick?.(); handleManagePlan(); }}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5"
                style={{
                  background: "rgba(99,102,241,0.18)",
                  border: "1px solid rgba(99,102,241,0.35)",
                  color: "#a5b4fc",
                }}
              >
                Manage Plan
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

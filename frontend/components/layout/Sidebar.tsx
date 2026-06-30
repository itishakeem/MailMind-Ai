"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/ThemeProvider";
import { THEMES } from "@/lib/theme";
import type { User } from "@/types";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/compose",
    label: "Compose",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    href: "/clients",
    label: "Clients",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: "/scheduled",
    label: "Scheduled",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export default function Sidebar({
  onNavClick,
  user,
  collapsed = false,
  onToggle,
}: {
  onNavClick?: () => void;
  user: User;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const pathname = usePathname();
  const router   = useRouter();
  const { theme, setTheme, mode, toggleMode } = useTheme();
  const [comingSoon, setComingSoon] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  function handleUpgradeClick() {
    onNavClick?.();
    setComingSoon(true);
    setTimeout(() => setComingSoon(false), 3500);
  }

  return (
    <aside
      className="flex flex-col py-4 h-full overflow-hidden"
      style={{
        width: collapsed ? "60px" : "224px",
        minWidth: collapsed ? "60px" : "224px",
        transition: "width 0.28s ease, min-width 0.28s ease",
        background: "#0f172a",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center justify-between mb-5 px-3">
        <Link
          href="/dashboard"
          onClick={onNavClick}
          className="flex items-center gap-2.5 group min-w-0"
          title="MailMind AI"
        >
          <Image
            src="/logo.png"
            alt="MailMind AI"
            width={32}
            height={32}
            className="flex-shrink-0 rounded-xl transition-transform group-hover:scale-105 animate-logo-glow"
          />
          {!collapsed && (
            <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors whitespace-nowrap">
              MailMind AI
            </span>
          )}
        </Link>

        {onToggle && (
          <button
            onClick={onToggle}
            className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-md transition-all hover:bg-white/8"
            style={{ color: "rgba(255,255,255,0.28)" }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.28)")}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={collapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
            </svg>
          </button>
        )}
      </div>

      {/* Nav section label */}
      {!collapsed && (
        <div className="px-4 mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.22)" }}>
            Navigation
          </span>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-hidden">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              onClick={onNavClick}
              className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
              style={
                isActive
                  ? {
                      background: "var(--a-nav)",
                      color: "#fff",
                      borderLeft: "2px solid var(--a-to)",
                      boxShadow: "inset 0 0 20px var(--a-nav)",
                    }
                  : {
                      color: "rgba(255,255,255,0.42)",
                      borderLeft: "2px solid transparent",
                    }
              }
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.78)";
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.42)";
                }
              }}
            >
              <span
                className={`flex-shrink-0 transition-transform duration-150 group-hover:scale-110 ${isActive ? "animate-icon-glow" : ""}`}
                style={isActive ? { color: "var(--a-text)" } : {}}
              >
                {item.icon}
              </span>
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Theme picker + dark mode toggle */}
      {!collapsed && (
        <div className="mx-3 mt-3 px-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.22)" }}>
              Theme
            </p>
            <button
              onClick={toggleMode}
              title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="flex items-center justify-center w-5 h-5 rounded transition-all hover:scale-110"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              {mode === "dark" ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={t.label}
                className="w-6 h-6 rounded-full transition-all duration-200 hover:scale-110"
                style={{
                  background: t.gradient,
                  transform: theme === t.id ? "scale(1.2)" : "scale(1)",
                  boxShadow: theme === t.id
                    ? `0 0 0 2px #0f172a, 0 0 0 4px rgba(255,255,255,0.4), 0 0 12px var(--a-glow)`
                    : "0 2px 6px rgba(0,0,0,0.3)",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Plan CTA */}
      <div className="mx-2 mt-3">
        {!collapsed ? (
          user.plan === "free" ? (
            <div
              className="rounded-xl p-3.5"
              style={{ background: "var(--a-bg)", border: "1px solid var(--a-bd)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold" style={{ color: "var(--a-text)" }}>Free Plan</span>
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                  style={{ background: "var(--a-badge-bg)", color: "var(--a-badge-text)" }}
                >
                  LIMITED
                </span>
              </div>
              <p className="text-[11px] leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.38)" }}>
                10 emails/mo · 5 clients
              </p>
              {comingSoon ? (
                <p className="rounded-lg py-2 text-center text-[10px] font-semibold animate-fade-in"
                  style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24" }}>
                  Coming Soon
                </p>
              ) : (
                <button
                  onClick={handleUpgradeClick}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold text-white transition-all animate-btn-glow"
                  style={{ background: "var(--a-gradient)" }}
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
              style={{ background: "var(--a-bg)", border: "1px solid var(--a-bd)" }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs font-bold" style={{ color: "var(--a-text)" }}>
                  ⚡ {user.plan === "pro" ? "Pro Plan" : "Business"}
                </span>
              </div>
              <p className="text-[11px] mb-2.5" style={{ color: "rgba(255,255,255,0.38)" }}>
                Unlimited emails &amp; clients
              </p>
              {comingSoon ? (
                <p className="rounded-lg py-1.5 text-center text-[10px] font-semibold animate-fade-in"
                  style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24" }}>
                  Coming Soon
                </p>
              ) : (
                <button
                  onClick={handleUpgradeClick}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--a-bg)", border: "1px solid var(--a-bd)", color: "var(--a-badge-text)" }}
                >
                  Manage Plan
                </button>
              )}
            </div>
          )
        ) : (
          /* Collapsed: icon-only upgrade pill for free users */
          user.plan === "free" && !comingSoon && (
            <button
              onClick={handleUpgradeClick}
              title="Upgrade to Pro"
              className="flex w-full items-center justify-center h-9 rounded-xl text-white transition-all"
              style={{ background: "var(--a-gradient)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          )
        )}
      </div>

      {/* Bottom: user info + logout */}
      <div
        className="mx-2 mt-3 pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {collapsed ? (
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex w-full items-center justify-center h-9 rounded-xl transition-all"
            style={{ color: "rgba(255,255,255,0.30)" }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(239,68,68,0.1)";
              e.currentTarget.style.color = "#f87171";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(255,255,255,0.30)";
            }}
          >
            <LogoutIcon />
          </button>
        ) : (
          <div className="flex items-center gap-2 px-1">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "rgba(255,255,255,0.6)" }}>
                {user.name}
              </p>
              <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.28)" }}>
                {user.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all"
              style={{ color: "rgba(255,255,255,0.30)" }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                e.currentTarget.style.color = "#f87171";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(255,255,255,0.30)";
              }}
            >
              <LogoutIcon />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

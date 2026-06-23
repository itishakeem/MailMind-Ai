"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import type { User } from "@/types";

interface NavbarProps {
  user: User;
  onMenuToggle?: () => void;
}

const PLAN_STYLES: Record<string, React.CSSProperties> = {
  free:     { background: "rgba(148,163,184,0.15)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.25)" },
  pro:      { background: "var(--a-bg)",            color: "var(--a-text)", border: "1px solid var(--a-bd)" },
  business: { background: "rgba(124,58,237,0.15)",  color: "#a78bfa", border: "1px solid rgba(124,58,237,0.35)" },
};

function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Navbar({ user, onMenuToggle }: NavbarProps) {
  const { mode, toggleMode } = useTheme();

  return (
    <header
      className="h-14 shrink-0 flex items-center justify-between px-4 md:px-6"
      style={{
        background: "var(--navbar-bg)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--navbar-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Hamburger — mobile only */}
      {onMenuToggle && (
        <button
          onClick={onMenuToggle}
          className="md:hidden mr-2 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          style={{ color: "var(--text-2)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(128,128,128,0.1)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 group">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-extrabold text-white transition-transform group-hover:scale-105"
          style={{ background: "linear-gradient(135deg, var(--a-from), var(--a-to))" }}
        >
          M
        </div>
        <span className="text-base font-bold transition-colors" style={{ color: "var(--text-1)" }}>
          MailMind <span className="gradient-text-static">AI</span>
        </span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Gmail status */}
        <div
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
          title={user.gmail_connected ? `Gmail: ${user.gmail_email}` : "Gmail not connected"}
          style={
            user.gmail_connected
              ? { background: "rgba(16,185,129,0.1)", color: "#059669", border: "1px solid rgba(16,185,129,0.25)" }
              : { background: "rgba(245,158,11,0.1)", color: "#d97706", border: "1px solid rgba(245,158,11,0.25)" }
          }
        >
          <span className={`h-1.5 w-1.5 rounded-full ${user.gmail_connected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
          {user.gmail_connected ? "Gmail" : "Gmail off"}
        </div>

        {/* Plan badge */}
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
          style={PLAN_STYLES[user.plan] ?? PLAN_STYLES.free}
        >
          {user.plan}
        </span>

        {/* Dark / light toggle */}
        <button
          onClick={toggleMode}
          title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:scale-105"
          style={{
            color: "var(--text-2)",
            background: "var(--bg-surface-2)",
            border: "1px solid var(--border)",
          }}
        >
          {mode === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* User name */}
        <span
          className="hidden md:block text-sm font-medium pl-2 border-l"
          style={{ color: "var(--text-2)", borderColor: "var(--border-2)" }}
        >
          {user.name}
        </span>
      </div>
    </header>
  );
}

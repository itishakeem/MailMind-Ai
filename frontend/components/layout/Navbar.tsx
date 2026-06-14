"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@/types";

interface NavbarProps {
  user: User;
  onMenuToggle?: () => void;
}

const PLAN_STYLES: Record<string, React.CSSProperties> = {
  free:     { background: "rgba(148,163,184,0.15)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.25)" },
  pro:      { background: "rgba(79,70,229,0.15)",   color: "#818cf8", border: "1px solid rgba(79,70,229,0.35)" },
  business: { background: "rgba(124,58,237,0.15)",  color: "#a78bfa", border: "1px solid rgba(124,58,237,0.35)" },
};

export default function Navbar({ user, onMenuToggle }: NavbarProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <header
      className="h-14 shrink-0 flex items-center justify-between px-6"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Hamburger — mobile only */}
      {onMenuToggle && (
        <button
          onClick={onMenuToggle}
          className="md:hidden mr-2 flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 group">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-extrabold text-white transition-transform group-hover:scale-105"
          style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}
        >
          M
        </div>
        <span className="text-base font-bold" style={{ color: "#0f172a" }}>
          MailMind <span className="gradient-text-static">AI</span>
        </span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Gmail status */}
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
          title={user.gmail_connected ? `Gmail: ${user.gmail_email}` : "Gmail not connected"}
          style={
            user.gmail_connected
              ? { background: "rgba(16,185,129,0.1)", color: "#059669", border: "1px solid rgba(16,185,129,0.25)" }
              : { background: "rgba(245,158,11,0.1)", color: "#d97706", border: "1px solid rgba(245,158,11,0.25)" }
          }
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${user.gmail_connected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`}
          />
          {user.gmail_connected ? "Gmail connected" : "Gmail not connected"}
        </div>

        {/* Plan badge */}
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
          style={PLAN_STYLES[user.plan] ?? PLAN_STYLES.free}
        >
          {user.plan}
        </span>

        {/* User */}
        <div className="flex items-center gap-2 border-l pl-3" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <span className="hidden text-sm font-medium text-gray-700 sm:block">{user.name}</span>
          <button
            onClick={handleLogout}
            className="rounded-lg px-2.5 py-1 text-xs font-medium transition-all hover:bg-red-50 hover:text-red-600"
            style={{ color: "#94a3b8" }}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

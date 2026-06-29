"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RoleBadge } from "./AdminShell";
import type { UserRole } from "@/types";

const NAV = [
  {
    href: "/admin",
    label: "Overview",
    exact: true,
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: "/admin/contacts",
    label: "Contacts",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
  },
];

interface Props {
  adminName: string;
  adminEmail: string;
  adminRole: UserRole;
  collapsed?: boolean;
  onNavClick?: () => void;
  onToggle?: () => void;
}

export default function AdminSidebar({ adminName, adminEmail, adminRole, collapsed, onNavClick, onToggle }: Props) {
  const pathname = usePathname();
  const router   = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <aside
      className="flex flex-col py-4 h-full overflow-hidden"
      style={{
        width: collapsed ? "60px" : "224px",
        minWidth: collapsed ? "60px" : "224px",
        transition: "width 0.28s ease, min-width 0.28s ease",
        background: "#0a0f1e",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Admin brand header */}
      <div className="flex items-center justify-between mb-2 px-3">
        <Link
          href="/admin"
          onClick={onNavClick}
          className="flex items-center gap-2.5 group min-w-0"
          title="Admin Panel"
        >
          <div
            className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-xl text-xs font-extrabold text-white transition-transform group-hover:scale-105"
            style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
          >
            A
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-bold text-white/80 group-hover:text-white transition-colors leading-tight">
                Admin Panel
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "rgba(239,68,68,0.7)" }}>
                MailMind AI
              </p>
            </div>
          )}
        </Link>
        {onToggle && (
          <button
            onClick={onToggle}
            className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-md transition-all"
            style={{ color: "rgba(255,255,255,0.28)" }}
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

      {/* Role badge */}
      {!collapsed && (
        <div className="mx-3 mb-4">
          <RoleBadge role={adminRole} pulse />
        </div>
      )}

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
        {NAV.map(item => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              onClick={onNavClick}
              className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
              style={
                isActive
                  ? { background: "rgba(239,68,68,0.15)", color: "#fff", borderLeft: "2px solid #ef4444" }
                  : { color: "rgba(255,255,255,0.42)", borderLeft: "2px solid transparent" }
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
              <span className="flex-shrink-0 transition-transform duration-150 group-hover:scale-110"
                style={isActive ? { color: "#f87171" } : {}}>
                {item.icon}
              </span>
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 my-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

      {/* Back to app */}
      {!collapsed && (
        <div className="px-3 mb-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.7)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
              (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.35)";
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to App
          </Link>
        </div>
      )}

      {/* User info + logout */}
      <div className="mx-2 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {collapsed ? (
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex w-full items-center justify-center h-9 rounded-xl transition-all"
            style={{ color: "rgba(255,255,255,0.30)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#f87171"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.30)"; }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-1">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "rgba(255,255,255,0.6)" }}>{adminName}</p>
              <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.28)" }}>{adminEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all"
              style={{ color: "rgba(255,255,255,0.30)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#f87171"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.30)"; }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

"use client";

import { useState, useCallback, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import { AdminProvider } from "./AdminContext";
import type { UserRole } from "@/types";

const COLLAPSED_KEY = "mailmind_admin_sidebar_collapsed";

interface Props {
  adminId: string;
  adminName: string;
  adminEmail: string;
  adminRole: UserRole;
  children: React.ReactNode;
}

export default function AdminShell({ adminId, adminName, adminEmail, adminRole, children }: Props) {
  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  useEffect(() => {
    setDesktopCollapsed(localStorage.getItem(COLLAPSED_KEY) === "true");
  }, []);

  const close  = useCallback(() => setSidebarOpen(false), []);
  const toggle = useCallback(() => setSidebarOpen(o => !o), []);

  const toggleDesktop = useCallback(() => {
    setDesktopCollapsed(v => {
      const next = !v;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <AdminProvider userId={adminId} role={adminRole}>
      <div className="min-h-screen flex" style={{ background: "var(--bg-page)" }}>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            style={{ backdropFilter: "blur(4px)" }}
            onClick={close}
            aria-hidden
          />
        )}

        {/* Mobile drawer */}
        <div
          className="fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ease-in-out"
          style={{ transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)" }}
        >
          <AdminSidebar
            adminName={adminName}
            adminEmail={adminEmail}
            adminRole={adminRole}
            onNavClick={close}
          />
        </div>

        {/* Desktop sidebar */}
        <div
          className="hidden md:flex flex-col flex-shrink-0 transition-all duration-300 sticky top-0 h-screen"
          style={{ width: desktopCollapsed ? "60px" : "224px" }}
        >
          <AdminSidebar
            adminName={adminName}
            adminEmail={adminEmail}
            adminRole={adminRole}
            collapsed={desktopCollapsed}
            onToggle={toggleDesktop}
          />
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header
            className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 h-14"
            style={{
              background: "var(--navbar-bg)",
              backdropFilter: "blur(12px)",
              borderBottom: "1px solid var(--navbar-border)",
            }}
          >
            <button
              onClick={toggle}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg"
              style={{ color: "var(--text-2)" }}
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="hidden md:flex items-center gap-2">
              <RoleBadge role={adminRole} pulse />
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <span className="text-xs font-medium hidden sm:block" style={{ color: "var(--text-3)" }}>
                {adminEmail}
              </span>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                title={adminName}
              >
                {adminName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminProvider>
  );
}

// Exported so sidebar can reuse it
export function RoleBadge({ role, pulse = false }: { role: UserRole; pulse?: boolean }) {
  const CONFIG: Record<UserRole, { label: string; color: string; bg: string; border: string }> = {
    user:        { label: "User",        color: "#6b7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)" },
    support:     { label: "Support",     color: "#3b82f6", bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.2)" },
    moderator:   { label: "Moderator",   color: "#10b981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)" },
    admin:       { label: "Admin",       color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)" },
    super_admin: { label: "Super Admin", color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)" },
  };
  const c = CONFIG[role] ?? CONFIG.user;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: c.color }} />}
      {c.label}
    </span>
  );
}

"use client";

import { useState, useCallback } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import type { User } from "@/types";

export default function DashboardShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const close = useCallback(() => setSidebarOpen(false), []);
  const toggle = useCallback(() => setSidebarOpen((o) => !o), []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar user={user} onMenuToggle={toggle} />

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          style={{ backdropFilter: "blur(4px)" }}
          onClick={close}
          aria-hidden
        />
      )}

      {/* Mobile slide-in drawer */}
      <div
        className="fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ease-in-out"
        style={{ transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)" }}
      >
        <Sidebar onNavClick={close} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

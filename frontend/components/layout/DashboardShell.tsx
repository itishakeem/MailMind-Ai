"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import AgentChatPanel from "@/components/agent/AgentChatPanel";
import type { User } from "@/types";

const INACTIVITY_MS    = 7 * 24 * 60 * 60 * 1000;
const LAST_ACTIVE_KEY  = "mailmind_last_active";
const COLLAPSED_KEY    = "mailmind_sidebar_collapsed";
const FLUSH_INTERVAL_MS = 5 * 60 * 1000; // flush due emails every 5 min while user is active

// Silently flushes past-due scheduled emails on mount and every 5 minutes.
// This is the primary dispatch path on the Hobby plan (daily cron is the fallback).
function useFlushDueEmails() {
  useEffect(() => {
    const flush = () => fetch("/api/emails/flush-due", { method: "POST" }).catch(() => {});
    flush();
    const id = setInterval(flush, FLUSH_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
}

function useInactivityLogout() {
  const router = useRouter();
  const throttleRef = useRef(false);

  useEffect(() => {
    function updateActivity() {
      if (throttleRef.current) return;
      throttleRef.current = true;
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      setTimeout(() => { throttleRef.current = false; }, 60_000);
    }

    async function checkAndLogout() {
      const last = localStorage.getItem(LAST_ACTIVE_KEY);
      if (last && Date.now() - parseInt(last) > INACTIVITY_MS) {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/auth/login");
      } else {
        updateActivity();
      }
    }

    checkAndLogout();

    const events = ["click", "keydown", "scroll", "touchstart", "mousemove"];
    events.forEach(ev => window.addEventListener(ev, updateActivity, { passive: true }));
    window.addEventListener("focus", checkAndLogout);

    return () => {
      events.forEach(ev => window.removeEventListener(ev, updateActivity));
      window.removeEventListener("focus", checkAndLogout);
    };
  }, [router]);
}

export default function DashboardShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  useInactivityLogout();
  useFlushDueEmails();

  const [sidebarOpen,       setSidebarOpen]       = useState(false);
  const [desktopCollapsed,  setDesktopCollapsed]  = useState(false);

  // Restore collapsed preference from localStorage on mount
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar user={user} onMenuToggle={toggle} />

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
          <Sidebar onNavClick={close} user={user} />
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Desktop sidebar */}
          <div
            className="hidden md:block flex-shrink-0 transition-all duration-300"
            style={{ width: desktopCollapsed ? "60px" : "224px" }}
          >
            <Sidebar
              user={user}
              collapsed={desktopCollapsed}
              onToggle={toggleDesktop}
            />
          </div>

          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>

        <AgentChatPanel user={user} />
      </div>
  );
}

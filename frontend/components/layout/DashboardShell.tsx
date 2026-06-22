"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import AgentChatPanel from "@/components/agent/AgentChatPanel";
import type { User } from "@/types";

const INACTIVITY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const LAST_ACTIVE_KEY = "mailmind_last_active";

function useInactivityLogout() {
  const router = useRouter();
  const throttleRef = useRef(false);

  useEffect(() => {
    function updateActivity() {
      if (throttleRef.current) return;
      throttleRef.current = true;
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      setTimeout(() => { throttleRef.current = false; }, 60_000); // throttle to once/minute
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
        <Sidebar onNavClick={close} plan={user.plan} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden md:flex">
          <Sidebar plan={user.plan} />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>

      {/* T024: Floating agent chat widget — renders nothing for free users */}
      <AgentChatPanel user={user} />
    </div>
  );
}

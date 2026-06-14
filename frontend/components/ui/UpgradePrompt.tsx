"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PlanLimitError } from "@/types";

// Listens for the custom "plan-limit-reached" event dispatched by lib/api-client.ts
// and renders an upgrade modal.
export default function UpgradePrompt() {
  const [details, setDetails] = useState<PlanLimitError | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      const data = (e as CustomEvent<PlanLimitError>).detail;
      setDetails(data);
    }
    window.addEventListener("plan-limit-reached", handler);
    return () => window.removeEventListener("plan-limit-reached", handler);
  }, []);

  if (!details) return null;

  const limitLabel =
    details.limit_type === "clients" ? "clients" : "emails this month";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) setDetails(null); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto text-2xl mb-4">
          🔒
        </div>
        <h2 className="text-lg font-bold text-gray-900">Plan Limit Reached</h2>
        <p className="mt-2 text-sm text-gray-500">
          You&apos;ve used {details.current_count} of your {details.max_allowed} allowed{" "}
          {limitLabel} on the free plan.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/settings?tab=billing"
            onClick={() => setDetails(null)}
            className="block w-full py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upgrade to Pro
          </Link>
          <button
            onClick={() => setDetails(null)}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

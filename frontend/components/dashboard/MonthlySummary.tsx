"use client";

import { useEffect, useState } from "react";
import Skeleton from "@/components/ui/Skeleton";

export default function MonthlySummary() {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/monthly-summary", { method: "POST" })
      .then((r) => r.json())
      .then((d) => { setSummary(d.summary ?? null); setLoading(false); })
      .catch(() => { setSummary(null); setLoading(false); });
  }, []);

  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <p className="text-sm font-medium text-gray-500 mb-2">Monthly Summary</p>
      {loading ? (
        <Skeleton lines={3} />
      ) : summary ? (
        <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
      ) : (
        <p className="text-sm text-gray-400 italic">
          No summary available yet — send some emails this month to see your activity overview.
        </p>
      )}
    </div>
  );
}

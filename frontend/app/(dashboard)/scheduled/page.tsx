"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import type { Email } from "@/types";

type ScheduledEmail = Pick<
  Email,
  "id" | "subject" | "client_snapshot" | "status" | "scheduled_at" | "failure_reason" | "created_at"
>;

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  scheduled: { background: "rgba(234,179,8,0.12)",  color: "#a16207" },
  failed:    { background: "rgba(239,68,68,0.12)",   color: "#dc2626" },
};

const cardStyle: React.CSSProperties = {
  background: "var(--bg-surface)",
  borderRadius: "16px",
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow-sm)",
};

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
}

export default function ScheduledPage() {
  const [emails,        setEmails]        = useState<ScheduledEmail[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [reschedulingId,setReschedulingId]= useState<string | null>(null);
  const [newDatetime,   setNewDatetime]   = useState<Record<string, string>>({});
  const flushed = useRef(false);

  useEffect(() => {
    if (flushed.current) return;
    flushed.current = true;

    async function loadAndFlush() {
      try {
        const r = await fetch("/api/emails/scheduled");
        const d = await r.json();
        const loaded: ScheduledEmail[] = d.emails ?? [];
        setEmails(loaded);

        // If any scheduled email is past due, flush it immediately.
        // This covers local dev (where the Vercel cron doesn't run) and acts as a
        // fast-path fallback in production before the 5-minute cron fires.
        const hasDue = loaded.some(
          e => e.status === "scheduled" && e.scheduled_at && new Date(e.scheduled_at) <= new Date()
        );
        if (hasDue) {
          const flush = await fetch("/api/emails/flush-due", { method: "POST" });
          if (flush.ok) {
            // Reload the list after flushing so sent/failed emails disappear
            const r2 = await fetch("/api/emails/scheduled");
            const d2 = await r2.json();
            setEmails(d2.emails ?? []);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    loadAndFlush();
  }, []);

  async function handleCancel(id: string) {
    if (!confirm("Cancel this scheduled email?")) return;
    const res = await fetch(`/api/emails/${id}/cancel`, { method: "DELETE" });
    if (res.ok) setEmails(prev => prev.filter(e => e.id !== id));
    else alert("Failed to cancel. Please try again.");
  }

  async function handleReschedule(id: string) {
    const dt = newDatetime[id];
    if (!dt) { alert("Please select a new date and time."); return; }
    const d = new Date(dt);
    if (d <= new Date(Date.now() + 60 * 1000)) {
      alert("Scheduled time must be at least 1 minute in the future.");
      return;
    }
    const res = await fetch(`/api/emails/${id}/reschedule`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduled_at: d.toISOString() }),
    });
    if (res.ok) {
      const updated = await res.json();
      setEmails(prev => prev.map(e => e.id === id ? { ...e, scheduled_at: updated.scheduled_at } : e));
      setReschedulingId(null);
    } else {
      alert("Failed to reschedule. Please try again.");
    }
  }

  async function handleRetry(id: string) {
    const res = await fetch(`/api/emails/${id}/retry`, { method: "POST" });
    if (res.ok) {
      setEmails(prev => prev.filter(e => e.id !== id));
      alert("Email sent successfully.");
    } else {
      const data = await res.json();
      alert(data.error ?? "Retry failed. Please check your Gmail connection.");
    }
  }

  const minDateTime = new Date(Date.now() + 2 * 60 * 1000).toISOString().slice(0, 16);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton variant="card" className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-extrabold text-gray-900">Scheduled Emails</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your upcoming and failed email deliveries.</p>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        {emails.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(79,70,229,0.08)" }}>
              <Clock className="h-7 w-7" style={{ color: "var(--a-to)" }} />
            </div>
            <p className="text-sm font-semibold text-gray-600">No scheduled emails.</p>
            <p className="text-xs text-gray-400 mt-1">Schedule an email from the Compose page.</p>
          </div>
        ) : (
          <div style={cardStyle} className="overflow-hidden">
            <table className="w-full text-sm">
              <thead style={{ background: "#fafafa", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <tr>
                  {["Recipient", "Subject", "Scheduled For", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {emails.map((email, i) => {
                  const snapshot = email.client_snapshot as { name?: string; email?: string };
                  return (
                    <tr
                      key={email.id}
                      style={{ borderTop: i > 0 ? "1px solid rgba(0,0,0,0.04)" : "none" }}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{snapshot?.name ?? "—"}</p>
                        <p className="text-xs text-gray-400">{snapshot?.email ?? ""}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{email.subject}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatDateTime(email.scheduled_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                          style={STATUS_STYLE[email.status] ?? {}}
                        >
                          {email.status}
                        </span>
                        {email.status === "failed" && email.failure_reason && (
                          <p className="text-xs mt-0.5 max-w-[160px] truncate" style={{ color: "#dc2626" }} title={email.failure_reason}>
                            {email.failure_reason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {email.status === "failed" && (
                            <button onClick={() => handleRetry(email.id)}
                              className="text-xs font-medium text-left transition-colors" style={{ color: "var(--a-to)" }}
                              onMouseEnter={e => (e.currentTarget.style.color = "#4338ca")}
                              onMouseLeave={e => (e.currentTarget.style.color = "var(--a-to)")}
                            >
                              Retry
                            </button>
                          )}
                          {email.status === "scheduled" && (
                            <>
                              {reschedulingId === email.id ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="datetime-local"
                                    min={minDateTime}
                                    value={newDatetime[email.id] ?? ""}
                                    onChange={e => setNewDatetime({ ...newDatetime, [email.id]: e.target.value })}
                                    className="text-xs rounded-lg px-2 py-1 focus:outline-none"
                                    style={{ border: "1px solid rgba(0,0,0,0.12)" }}
                                  />
                                  <button onClick={() => handleReschedule(email.id)}
                                    className="text-xs font-medium" style={{ color: "var(--a-to)" }}>
                                    Save
                                  </button>
                                  <button onClick={() => setReschedulingId(null)}
                                    className="text-xs text-gray-400">
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setReschedulingId(email.id)}
                                  className="text-xs font-medium text-left text-gray-500 hover:text-gray-800 transition-colors">
                                  Reschedule
                                </button>
                              )}
                              <button onClick={() => handleCancel(email.id)}
                                className="text-xs font-medium text-left transition-colors" style={{ color: "#ef4444" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")}
                                onMouseLeave={e => (e.currentTarget.style.color = "#ef4444")}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

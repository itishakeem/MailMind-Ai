"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "16px",
  border: "1px solid rgba(0,0,0,0.06)",
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};

const gradientBtn: React.CSSProperties = {
  background: "linear-gradient(135deg,#2563eb,#4f46e5)",
  boxShadow: "0 4px 14px rgba(79,70,229,0.3)",
};

interface GmailStatus {
  connected: boolean;
  gmail_email: string | null;
}

export default function SettingsPage() {
  const [gmailStatus,     setGmailStatus]     = useState<GmailStatus | null>(null);
  const [signature,       setSignature]       = useState("");
  const [savingSignature, setSavingSignature] = useState(false);
  const [disconnecting,   setDisconnecting]   = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/gmail/status")
      .then(r => r.json())
      .then(setGmailStatus)
      .catch(() => setGmailStatus({ connected: false, gmail_email: null }));
  }, []);

  async function handleDisconnect() {
    if (!confirm("Disconnect Gmail? All scheduled emails will be paused.")) return;
    setDisconnecting(true);
    const res = await fetch("/api/gmail/disconnect", { method: "DELETE" });
    setDisconnecting(false);
    if (res.ok) {
      setGmailStatus({ connected: false, gmail_email: null });
      setMessage({ type: "success", text: "Gmail disconnected successfully." });
    } else {
      setMessage({ type: "error", text: "Failed to disconnect. Please try again." });
    }
  }

  async function handleSaveSignature() {
    setSavingSignature(true);
    const res = await fetch("/api/settings/signature", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signature }),
    });
    setSavingSignature(false);
    setMessage(
      res.ok
        ? { type: "success", text: "Signature saved." }
        : { type: "error", text: "Failed to save signature." }
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-extrabold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your Gmail connection and email signature.</p>
      </div>

      {message && (
        <div
          className="rounded-xl px-4 py-3 text-sm animate-fade-in"
          style={
            message.type === "success"
              ? { background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#15803d" }
              : { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#dc2626" }
          }
        >
          {message.text}
        </div>
      )}

      {/* Gmail Connection */}
      <div style={cardStyle} className="p-6 animate-fade-in-up">
        <h2 className="text-base font-bold text-gray-900 mb-5">Gmail Connection</h2>
        {gmailStatus === null ? (
          <div className="h-10 rounded-lg animate-pulse" style={{ background: "rgba(0,0,0,0.05)" }} />
        ) : gmailStatus.connected ? (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-semibold text-gray-900">Connected</span>
              </div>
              <p className="text-sm text-gray-500 ml-4">{gmailStatus.gmail_email}</p>
              <p className="text-xs text-gray-400 ml-4 mt-0.5">Send-only permission. We never read your emails.</p>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.05)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-sm font-semibold text-gray-900">Not connected</span>
              </div>
              <p className="text-sm text-gray-500 ml-4">Connect Gmail to send emails from your own address.</p>
            </div>
            <Link
              href="/api/gmail/connect"
              className="px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5"
              style={gradientBtn}
            >
              Connect Gmail
            </Link>
          </div>
        )}
      </div>

      {/* Email Signature */}
      <div style={cardStyle} className="p-6 animate-fade-in-up">
        <h2 className="text-base font-bold text-gray-900 mb-4">Email Signature</h2>
        <textarea
          value={signature}
          onChange={e => setSignature(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder={"Best regards,\nAhmed Khan\nFreelance Web Developer"}
          className="w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none transition-colors"
          style={{ border: "1px solid rgba(0,0,0,0.1)", background: "#fafafa" }}
          onFocus={e => (e.currentTarget.style.borderColor = "rgba(79,70,229,0.5)")}
          onBlur={e => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)")}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-400">{signature.length} / 500</span>
          <button
            onClick={handleSaveSignature}
            disabled={savingSignature}
            className="px-4 py-2 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-60"
            style={gradientBtn}
          >
            {savingSignature ? "Saving…" : "Save Signature"}
          </button>
        </div>
      </div>
    </div>
  );
}

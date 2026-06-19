"use client";

import { useEffect, useState } from "react";
import { Pencil, Check, X, Mail, Users, Calendar, ShieldCheck } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import Modal from "@/components/ui/Modal";
import ProBadge from "@/components/ui/ProBadge";
import { createClient } from "@/lib/supabase/client";

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

const PLAN_STYLE: Record<string, React.CSSProperties> = {
  free:     { background: "rgba(148,163,184,0.12)", color: "#64748b",  border: "1px solid rgba(148,163,184,0.25)" },
  pro:      { background: "rgba(79,70,229,0.12)",   color: "#4f46e5",  border: "1px solid rgba(79,70,229,0.3)"   },
  business: { background: "rgba(124,58,237,0.12)",  color: "#7c3aed",  border: "1px solid rgba(124,58,237,0.3)"  },
};

interface Profile {
  id: string;
  name: string;
  email: string;
  plan: string;
  gmail_email: string | null;
  gmail_connected: boolean;
  email_signature: string;
  created_at: string;
  stats: { emails_sent_this_month: number; total_clients: number };
}

function StatPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div style={cardStyle} className="flex items-center gap-3 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(79,70,229,0.08)" }}>
        <Icon className="h-4 w-4" style={{ color: "#4f46e5" }} />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-base font-extrabold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [profile,       setProfile]       = useState<Profile | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [editing,       setEditing]       = useState(false);
  const [nameVal,       setNameVal]       = useState("");
  const [saving,        setSaving]        = useState(false);
  const [message,       setMessage]       = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [focused,       setFocused]       = useState(false);
  const [deleteOpen,    setDeleteOpen]    = useState(false);
  const [confirmText,   setConfirmText]   = useState("");
  const [deleting,      setDeleting]      = useState(false);
  const [deleteError,   setDeleteError]   = useState<string | null>(null);
  const [upgrading,     setUpgrading]     = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [signature,     setSignature]     = useState("");
  const [sigSaving,     setSigSaving]     = useState(false);
  const [sigFocused,    setSigFocused]    = useState(false);

  async function handleUpgrade() {
    setUpgrading(true);
    const res = await fetch("/api/payments/checkout", { method: "POST" });
    const data = await res.json();
    setUpgrading(false);
    if (data.url) window.location.href = data.url;
    else setMessage({ type: "error", text: data.error ?? "Could not open checkout." });
  }

  async function handleManagePlan() {
    setPortalLoading(true);
    const res = await fetch("/api/payments/portal", { method: "POST" });
    const data = await res.json();
    setPortalLoading(false);
    if (data.url) window.open(data.url, "_blank");
    else setMessage({ type: "error", text: data.error ?? "Could not open billing portal." });
  }

  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(d => { setProfile(d); setNameVal(d.name ?? ""); setSignature(d.email_signature ?? ""); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleSaveName() {
    if (!nameVal.trim()) return;
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameVal }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setProfile(prev => prev ? { ...prev, name: data.name } : prev);
      setEditing(false);
      setMessage({ type: "success", text: "Name updated successfully." });
    } else {
      setMessage({ type: "error", text: "Failed to update name." });
    }
  }

  function cancelEdit() {
    setNameVal(profile?.name ?? "");
    setEditing(false);
  }

  async function handleSaveSignature() {
    setSigSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_signature: signature }),
    });
    setSigSaving(false);
    if (res.ok) {
      setMessage({ type: "success", text: "Email signature saved." });
    } else {
      const data = await res.json();
      setMessage({ type: "error", text: data.error ?? "Failed to save signature." });
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    const res = await fetch("/api/account/delete", { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error ?? "Failed to delete account. Please try again.");
      setDeleting(false);
      return;
    }
    // Sign out locally then redirect to home
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-5">
        <Skeleton className="h-8 w-32" />
        <Skeleton variant="card" className="h-48" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton variant="card" className="h-20" />
          <Skeleton variant="card" className="h-20" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return <p className="text-sm text-gray-500 py-10 text-center">Could not load profile.</p>;
  }

  const initials = profile.name?.charAt(0).toUpperCase() ?? "?";
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-PK", {
    month: "long", year: "numeric",
  });

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-extrabold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Your account details and usage overview.</p>
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

      {/* Identity card */}
      <div style={cardStyle} className="p-6 animate-fade-in-up">
        <div className="flex items-start gap-5 flex-wrap">
          {/* Avatar */}
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-extrabold text-white"
            style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name row */}
            <div className="flex items-center gap-2 mb-1">
              {editing ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    value={nameVal}
                    onChange={e => setNameVal(e.target.value)}
                    className="flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-900 focus:outline-none transition-colors"
                    style={{
                      border: focused ? "1px solid rgba(79,70,229,0.6)" : "1px solid rgba(0,0,0,0.12)",
                      boxShadow: focused ? "0 0 0 3px rgba(79,70,229,0.15)" : "none",
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") cancelEdit(); }}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                    style={gradientBtn}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
                    style={{ borderColor: "rgba(0,0,0,0.1)" }}
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-extrabold text-gray-900">{profile.name}</h2>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                    title="Edit name"
                  >
                    <Pencil className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </>
              )}
            </div>

            {/* Email */}
            <p className="text-sm text-gray-500 mb-3">{profile.email}</p>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {profile.plan === "free" ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize"
                  style={PLAN_STYLE.free}
                >
                  <ShieldCheck className="h-3 w-3" />
                  Free plan
                </span>
              ) : (
                <ProBadge plan={profile.plan as "pro" | "business"} size="md" />
              )}
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                style={
                  profile.gmail_connected
                    ? { background: "rgba(34,197,94,0.1)", color: "#15803d", border: "1px solid rgba(34,197,94,0.2)" }
                    : { background: "rgba(245,158,11,0.1)", color: "#d97706", border: "1px solid rgba(245,158,11,0.2)" }
                }
              >
                <span className={`h-1.5 w-1.5 rounded-full ${profile.gmail_connected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
                {profile.gmail_connected ? `Gmail: ${profile.gmail_email}` : "Gmail not connected"}
              </span>
            </div>

            {/* Plan action */}
            <div className="mt-3">
              {profile.plan === "free" ? (
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed animate-btn-glow"
                  style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {upgrading ? "Opening checkout…" : "Upgrade to Pro — $9/mo"}
                </button>
              ) : (
                <button
                  onClick={handleManagePlan}
                  disabled={portalLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    color: "#4f46e5",
                  }}
                >
                  {portalLoading ? "Loading…" : "Manage Subscription"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        <StatPill icon={Mail}     label="Emails this month" value={profile.stats.emails_sent_this_month} />
        <StatPill icon={Users}    label="Total clients"     value={profile.stats.total_clients} />
        <StatPill icon={Calendar} label="Member since"      value={memberSince} />
      </div>

      {/* Email Signature (Pro) */}
      <div style={{ ...cardStyle, animationDelay: "100ms" }} className="p-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-gray-900">Email Signature</h3>
          {(profile.plan === "pro" || profile.plan === "business") && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.1)", color: "#4f46e5" }}>Pro</span>
          )}
        </div>
        {profile.plan === "free" ? (
          <div
            className="mt-3 rounded-xl p-4 text-sm"
            style={{ background: "rgba(99,102,241,0.04)", border: "1px dashed rgba(99,102,241,0.3)" }}
          >
            <p className="text-gray-500 mb-2">Personalise every email with a closing signature — name, title, phone, website.</p>
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="inline-flex items-center gap-1 text-xs font-bold rounded-lg px-3 py-1.5 text-white"
              style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}
            >
              ⚡ Upgrade to Pro
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-gray-400">Added automatically below every email you send. Max 500 characters. Plain text only.</p>
            <textarea
              value={signature}
              onChange={e => setSignature(e.target.value.slice(0, 500))}
              rows={4}
              maxLength={500}
              placeholder={"Best regards,\nYour Name\nYour Title | yoursite.com | +92 300 000 0000"}
              className="w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none transition-colors"
              style={{
                border: sigFocused ? "1px solid rgba(79,70,229,0.5)" : "1px solid rgba(0,0,0,0.12)",
                boxShadow: sigFocused ? "0 0 0 3px rgba(79,70,229,0.1)" : "none",
              }}
              onFocus={() => setSigFocused(true)}
              onBlur={() => setSigFocused(false)}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{signature.length}/500</span>
              <button
                onClick={handleSaveSignature}
                disabled={sigSaving}
                className="px-4 py-2 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}
              >
                {sigSaving ? "Saving…" : "Save Signature"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Account info */}
      <div style={cardStyle} className="p-6 animate-fade-in-up" >
        <h3 className="text-sm font-bold text-gray-900 mb-4">Account Information</h3>
        <dl className="space-y-3 text-sm">
          {[
            { label: "Account ID",    value: profile.id },
            { label: "Email address", value: profile.email },
            { label: "Member since",  value: memberSince },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between gap-4">
              <dt className="text-gray-400 shrink-0">{label}</dt>
              <dd className="text-gray-900 text-right font-medium break-all">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Danger zone */}
      <div
        className="p-6 rounded-2xl animate-fade-in-up"
        style={{
          border: "1px solid rgba(239,68,68,0.25)",
          background: "rgba(239,68,68,0.03)",
          animationDelay: "120ms",
        }}
      >
        <h3 className="text-sm font-bold text-red-600 mb-1">Danger Zone</h3>
        <p className="text-sm text-gray-500 mb-4">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <button
          onClick={() => { setDeleteOpen(true); setConfirmText(""); setDeleteError(null); }}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)", boxShadow: "0 4px 14px rgba(220,38,38,0.3)" }}
        >
          Delete Account
        </button>
      </div>

      {/* Delete confirmation modal */}
      <Modal open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} title="Delete Account">
        <div className="space-y-4">
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}
          >
            This will permanently delete your account, all clients, emails, and documents. There is no way to recover this data.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Type <span className="font-bold text-gray-900">DELETE</span> to confirm
            </label>
            <input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none transition-colors"
              style={{
                borderColor: confirmText === "DELETE" ? "rgba(239,68,68,0.5)" : "rgba(0,0,0,0.12)",
                boxShadow: confirmText === "DELETE" ? "0 0 0 3px rgba(239,68,68,0.1)" : "none",
              }}
              disabled={deleting}
              autoComplete="off"
            />
          </div>

          {deleteError && (
            <p className="text-sm text-red-600">{deleteError}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-gray-700 border transition-colors hover:bg-gray-50 disabled:opacity-50"
              style={{ borderColor: "rgba(0,0,0,0.1)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={confirmText !== "DELETE" || deleting}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
              style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)", boxShadow: "0 4px 14px rgba(220,38,38,0.3)" }}
            >
              {deleting ? "Deleting…" : "Delete My Account"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

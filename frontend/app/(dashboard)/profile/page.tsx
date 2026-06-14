"use client";

import { useEffect, useState } from "react";
import { Pencil, Check, X, Mail, Users, Calendar, ShieldCheck } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";

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
  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [nameVal,  setNameVal]  = useState("");
  const [saving,   setSaving]   = useState(false);
  const [message,  setMessage]  = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [focused,  setFocused]  = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(d => { setProfile(d); setNameVal(d.name ?? ""); setLoading(false); })
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
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize"
                style={PLAN_STYLE[profile.plan] ?? PLAN_STYLE.free}
              >
                <ShieldCheck className="h-3 w-3" />
                {profile.plan} plan
              </span>
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
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        <StatPill icon={Mail}     label="Emails this month" value={profile.stats.emails_sent_this_month} />
        <StatPill icon={Users}    label="Total clients"     value={profile.stats.total_clients} />
        <StatPill icon={Calendar} label="Member since"      value={memberSince} />
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
    </div>
  );
}

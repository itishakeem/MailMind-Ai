"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "#fff",
  borderRadius: "0.75rem",
  padding: "0.625rem 0.875rem",
  fontSize: "0.875rem",
  outline: "none",
  transition: "border-color 0.18s, box-shadow 0.18s",
};

export default function ResetPasswordPage() {
  const [email, setEmail]   = useState("");
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "rgba(99,102,241,0.15)" }}
        >
          <MailCheck className="h-6 w-6" style={{ color: "#818cf8" }} />
        </div>
        <h2 className="text-lg font-bold text-white">Check your inbox</h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          If <span className="font-medium text-white">{email}</span> is registered,
          we sent a password reset link.
        </p>
        <Link
          href="/auth/login"
          className="mt-2 block text-sm font-medium transition-colors"
          style={{ color: "#818cf8" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#a5b4fc")}
          onMouseLeave={e => (e.currentTarget.style.color = "#818cf8")}
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Reset your password</h2>
        <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              ...inputStyle,
              ...(focused
                ? { borderColor: "rgba(99,102,241,0.7)", boxShadow: "0 0 0 3px rgba(99,102,241,0.2)" }
                : {}),
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg,#2563eb,#4f46e5)",
            boxShadow: "0 4px 18px rgba(79,70,229,0.4)",
          }}
        >
          {loading ? "Sending…" : "Send Reset Link"}
        </button>
      </form>
      <Link
        href="/auth/login"
        className="block text-center text-sm transition-colors"
        style={{ color: "rgba(255,255,255,0.35)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
      >
        Back to sign in
      </Link>
    </div>
  );
}

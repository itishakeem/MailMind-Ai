"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  const router = useRouter();
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type: "password_reset" }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    // Always redirect (we don't reveal whether the email exists)
    router.push(`/auth/verify-otp?type=password_reset&email=${encodeURIComponent(email)}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Forgot password?</h2>
        <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          Enter your email and we&apos;ll send a 6-digit reset code.
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
            autoComplete="email"
            style={{
              ...inputStyle,
              ...(focused ? { borderColor: "rgba(99,102,241,0.7)", boxShadow: "0 0 0 3px rgba(99,102,241,0.2)" } : {}),
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>

        {error && (
          <div
            className="rounded-xl px-4 py-2.5 text-sm"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5" }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg,#2563eb,#4f46e5)",
            boxShadow: "0 4px 18px rgba(79,70,229,0.4)",
          }}
        >
          {loading ? "Sending code…" : "Send Reset Code"}
        </button>
      </form>

      <Link
        href="/auth/login"
        className="block text-center text-sm transition-colors"
        style={{ color: "rgba(255,255,255,0.35)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
      >
        ← Back to sign in
      </Link>
    </div>
  );
}

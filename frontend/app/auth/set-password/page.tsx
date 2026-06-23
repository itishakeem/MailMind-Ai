"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "#fff",
  borderRadius: "0.75rem",
  padding: "0.625rem 0.875rem",
  fontSize: "0.875rem",
  width: "100%",
  outline: "none",
  transition: "border-color 0.18s, box-shadow 0.18s",
};

const inputFocusStyle: React.CSSProperties = {
  borderColor: "rgba(99,102,241,0.7)",
  boxShadow: "0 0 0 3px rgba(99,102,241,0.2)",
};

function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [focusedPw, setFocusedPw] = useState(false);
  const [focusedCf, setFocusedCf] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [done, setDone]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset_token: token, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Failed to update password."); return; }

    setDone(true);
    setTimeout(() => router.push("/auth/login"), 2500);
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm" style={{ color: "#fca5a5" }}>Invalid reset link.</p>
        <Link href="/auth/reset" className="text-sm font-semibold" style={{ color: "var(--a-text)" }}>
          Request a new one
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "rgba(34,197,94,0.15)" }}
        >
          <svg className="h-6 w-6" fill="none" stroke="#4ade80" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white">Password updated!</h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          Redirecting you to sign in…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Set new password</h2>
        <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
            New Password
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            style={{ ...inputStyle, ...(focusedPw ? inputFocusStyle : {}) }}
            onFocus={() => setFocusedPw(true)}
            onBlur={() => setFocusedPw(false)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
            Confirm Password
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            autoComplete="new-password"
            style={{ ...inputStyle, ...(focusedCf ? inputFocusStyle : {}) }}
            onFocus={() => setFocusedCf(true)}
            onBlur={() => setFocusedCf(false)}
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
            background: "var(--a-gradient)",
            boxShadow: "0 4px 18px var(--a-glow)",
          }}
        >
          {loading ? "Updating…" : "Update Password"}
        </button>
      </form>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense>
      <SetPasswordContent />
    </Suspense>
  );
}

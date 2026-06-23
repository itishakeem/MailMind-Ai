"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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

function Field({
  label, type, value, onChange, placeholder, autoComplete, minLength,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  autoComplete?: string; minLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
        {label}
      </label>
      <input
        type={type}
        required
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        style={{ ...inputStyle, ...(focused ? inputFocusStyle : {}) }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

export default function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, type: "signup" }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to send verification code.");
      return;
    }

    // Temporarily hold credentials in sessionStorage for the OTP page to pick up
    sessionStorage.setItem("signup_name", form.name);
    sessionStorage.setItem("signup_password", form.password);

    router.push(`/auth/verify-otp?type=signup&email=${encodeURIComponent(form.email)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        label="Full Name"
        type="text"
        value={form.name}
        onChange={v => setForm({ ...form, name: v })}
        placeholder="Ahmed Khan"
        autoComplete="name"
      />
      <Field
        label="Email Address"
        type="email"
        value={form.email}
        onChange={v => setForm({ ...form, email: v })}
        placeholder="you@example.com"
        autoComplete="email"
      />
      <Field
        label="Password"
        type="password"
        value={form.password}
        onChange={v => setForm({ ...form, password: v })}
        placeholder="Min. 8 characters"
        autoComplete="new-password"
        minLength={8}
      />

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
        {loading ? "Sending code…" : "Create Account"}
      </button>
    </form>
  );
}

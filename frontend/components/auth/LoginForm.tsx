"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

function Field({
  label, type, value, onChange, placeholder, autoComplete,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string; autoComplete?: string;
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
        style={{ ...inputStyle, ...(focused ? inputFocusStyle : {}) }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    setLoading(false);

    if (loginError) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        placeholder="Your password"
        autoComplete="current-password"
      />

      {error && (
        <div
          className="rounded-xl px-4 py-2.5 text-sm"
          style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5" }}
        >
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Link href="/auth/reset" className="text-sm transition-colors" style={{ color: "rgba(99,102,241,0.85)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#818cf8")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(99,102,241,0.85)")}
        >
          Forgot password?
        </Link>
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
        {loading ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}

"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const inputStyle: React.CSSProperties = {
  width: "3rem",
  height: "3.5rem",
  textAlign: "center",
  fontSize: "1.5rem",
  fontWeight: 800,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "#fff",
  borderRadius: "0.75rem",
  outline: "none",
  transition: "border-color 0.18s, box-shadow 0.18s",
};

const inputFocusStyle: React.CSSProperties = {
  borderColor: "rgba(99,102,241,0.7)",
  boxShadow: "0 0 0 3px rgba(99,102,241,0.2)",
};

function OtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const type = (searchParams.get("type") ?? "signup") as "signup" | "password_reset";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  // Auto-focus first input on mount
  useEffect(() => { refs[0].current?.focus(); }, []);

  function handleChange(idx: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = digit;
    setDigits(next);
    if (digit && idx < 5) refs[idx + 1].current?.focus();
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      refs[idx - 1].current?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      refs[5].current?.focus();
    }
  }

  async function handleVerify() {
    const otp = digits.join("");
    if (otp.length < 6) { setError("Enter all 6 digits."); return; }

    setError(null);
    setLoading(true);

    const payload: Record<string, string> = { email, otp, type };

    if (type === "signup") {
      const name = sessionStorage.getItem("signup_name") ?? "";
      const password = sessionStorage.getItem("signup_password") ?? "";
      if (!name || !password) {
        setError("Session expired. Please sign up again.");
        setLoading(false);
        router.push("/auth/signup");
        return;
      }
      payload.name = name;
      payload.password = password;
    }

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Verification failed.");
      return;
    }

    if (type === "signup") {
      // Sign in the newly created account
      const supabase = createClient();
      const password = sessionStorage.getItem("signup_password") ?? "";
      await supabase.auth.signInWithPassword({ email, password });
      sessionStorage.removeItem("signup_name");
      sessionStorage.removeItem("signup_password");
      router.push("/dashboard");
      router.refresh();
    } else {
      router.push(`/auth/set-password?token=${data.reset_token}`);
    }
  }

  async function handleResend() {
    setResending(true);
    setResent(false);
    setError(null);
    await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type }),
    });
    setResending(false);
    setResent(true);
    setDigits(["", "", "", "", "", ""]);
    refs[0].current?.focus();
  }

  const title = type === "signup" ? "Verify your email" : "Check your email";
  const subtitle =
    type === "signup"
      ? "We sent a 6-digit code to"
      : "We sent a password reset code to";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          {subtitle}{" "}
          <span className="font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>
            {email}
          </span>
        </p>
      </div>

      <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={refs[i]}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onFocus={() => setFocusedIdx(i)}
            onBlur={() => setFocusedIdx(null)}
            style={{ ...inputStyle, ...(focusedIdx === i ? inputFocusStyle : {}) }}
          />
        ))}
      </div>

      {error && (
        <div
          className="rounded-xl px-4 py-2.5 text-sm"
          style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5" }}
        >
          {error}
        </div>
      )}

      {resent && (
        <p className="text-center text-sm" style={{ color: "rgba(99,255,150,0.75)" }}>
          New code sent!
        </p>
      )}

      <button
        onClick={handleVerify}
        disabled={loading || digits.join("").length < 6}
        className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg,#2563eb,#4f46e5)",
          boxShadow: "0 4px 18px rgba(79,70,229,0.4)",
        }}
      >
        {loading ? "Verifying…" : "Verify Code"}
      </button>

      <p className="text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
        Didn&apos;t receive it?{" "}
        <button
          onClick={handleResend}
          disabled={resending}
          className="font-semibold transition-colors disabled:opacity-50"
          style={{ color: "rgba(99,102,241,0.85)" }}
        >
          {resending ? "Sending…" : "Resend code"}
        </button>
      </p>

      <Link
        href={type === "signup" ? "/auth/signup" : "/auth/login"}
        className="block text-center text-sm transition-colors"
        style={{ color: "rgba(255,255,255,0.3)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
      >
        ← Go back
      </Link>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <OtpContent />
    </Suspense>
  );
}

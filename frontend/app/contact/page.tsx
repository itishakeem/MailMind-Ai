"use client";

import { useState } from "react";
import { Mail, Clock, Send } from "lucide-react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

const BG   = "#0A0A0F";
const SURF = "#111118";
const BORD = "#1E1E2A";
const ACC  = "#6366F1";
const TXT  = "#F8F8FF";
const SEC  = "#9CA3AF";

const SUBJECTS = ["General", "Bug Report", "Feature Request", "Partnership"] as const;
type Subject = typeof SUBJECTS[number];

interface FormState {
  name: string;
  email: string;
  subject: Subject;
  message: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: SURF,
  border: `1px solid ${BORD}`,
  borderRadius: "0.5rem",
  padding: "0.625rem 0.875rem",
  fontSize: "0.875rem",
  color: TXT,
  outline: "none",
  transition: "border-color 0.15s",
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium" style={{ color: SEC }}>{label}</label>
      {children}
      {error && <p className="mt-1 text-xs" style={{ color: "#f87171" }}>{error}</p>}
    </div>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({ name: "", email: "", subject: "General", message: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate(): boolean {
    const e: FieldErrors = {};
    if (!form.name.trim() || form.name.trim().length > 100) e.name = "Name is required (max 100 chars).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (form.message.trim().length < 10 || form.message.trim().length > 2000) e.message = "Message must be 10–2000 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    setSuccess(true);
    setForm({ name: "", email: "", subject: "General", message: "" });
  }

  const focusBorder = (el: HTMLElement) => (el.style.borderColor = ACC);
  const blurBorder  = (el: HTMLElement) => (el.style.borderColor = BORD);

  return (
    <div style={{ background: BG, color: TXT, minHeight: "100vh" }}>
      <MarketingNav />

      <div className="mx-auto max-w-xl px-4 sm:px-6 py-20">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold mb-3" style={{ color: TXT, letterSpacing: "-0.02em" }}>
            Get in Touch
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: SEC }}>
            Have a question, feedback, or partnership inquiry? We&apos;d love to hear from you.
          </p>
        </div>

        {success ? (
          <div className="rounded-xl p-8 text-center" style={{ background: SURF, border: `1px solid #22c55e40` }}>
            <Send className="mx-auto mb-4 h-8 w-8" style={{ color: "#22c55e" }} />
            <p className="text-base font-semibold mb-2" style={{ color: TXT }}>Message sent!</p>
            <p className="text-sm" style={{ color: SEC }}>
              We&apos;ll get back to you within 24 hours.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-6 text-sm transition-colors"
              style={{ color: ACC }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--a-text)")}
              onMouseLeave={e => (e.currentTarget.style.color = ACC)}
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-xl p-6 sm:p-8 space-y-5" style={{ background: SURF, border: `1px solid ${BORD}` }}>
            <Field label="Name" error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
                style={inputStyle}
                onFocus={e => focusBorder(e.currentTarget)}
                onBlur={e => blurBorder(e.currentTarget)}
              />
            </Field>

            <Field label="Email" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={e => focusBorder(e.currentTarget)}
                onBlur={e => blurBorder(e.currentTarget)}
              />
            </Field>

            <Field label="Subject">
              <select
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value as Subject })}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={e => focusBorder(e.currentTarget)}
                onBlur={e => blurBorder(e.currentTarget)}
              >
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>

            <Field label="Message" error={errors.message}>
              <textarea
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Tell us what's on your mind..."
                rows={5}
                style={{ ...inputStyle, resize: "vertical" }}
                onFocus={e => focusBorder(e.currentTarget)}
                onBlur={e => blurBorder(e.currentTarget)}
              />
              <p className="mt-1 text-right text-xs" style={{ color: SEC }}>
                {form.message.length} / 2000
              </p>
            </Field>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg py-3 text-sm font-medium text-white transition-colors disabled:opacity-60"
              style={{ background: ACC }}
              onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = "var(--a-to)"; }}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = ACC}
            >
              {submitting ? "Sending…" : "Send Message"}
            </button>
          </form>
        )}

        {/* Support info */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex items-start gap-3 rounded-xl p-4" style={{ background: SURF, border: `1px solid ${BORD}` }}>
            <Mail className="h-4 w-4 shrink-0 mt-0.5" style={{ color: ACC }} />
            <div>
              <p className="text-xs font-semibold mb-0.5" style={{ color: TXT }}>Email us directly</p>
              <p className="text-xs" style={{ color: SEC }}>support@mailmind.ai</p>
            </div>
          </div>
          <div className="flex-1 flex items-start gap-3 rounded-xl p-4" style={{ background: SURF, border: `1px solid ${BORD}` }}>
            <Clock className="h-4 w-4 shrink-0 mt-0.5" style={{ color: ACC }} />
            <div>
              <p className="text-xs font-semibold mb-0.5" style={{ color: TXT }}>Response time</p>
              <p className="text-xs" style={{ color: SEC }}>We reply within 24 hours.</p>
            </div>
          </div>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}

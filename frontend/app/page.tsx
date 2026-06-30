"use client";

import Link from "next/link";
import {
  Mail, FileText, Sliders, Clock, Users, Zap,
  Check, ChevronRight, Quote,
  AlignLeft, Cpu, Send, Inbox,
} from "lucide-react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

/* ─── Design tokens ───────────────────────────────────────────── */
const BG   = "#0A0A0F";
const SURF = "#111118";
const BORD = "#1E1E2A";
const ACC  = "#6366F1";
const TXT  = "#F8F8FF";
const SEC  = "#9CA3AF";

/* ─── Static data ─────────────────────────────────────────────── */
const STEPS = [
  { icon: AlignLeft, step: "01", title: "Describe Your Work",   desc: "Type a brief description or upload a PDF invoice, contract, or proposal." },
  { icon: Cpu,       step: "02", title: "AI Detects Type",       desc: "Our AI classifies the context — invoice, reminder, update, or proposal." },
  { icon: Mail,      step: "03", title: "Email Generated",       desc: "A professional, tone-matched email is written in seconds — ready to review." },
  { icon: Send,      step: "04", title: "Sent from Your Gmail",  desc: "The email is delivered from your own Gmail address — not a shared platform address." },
];

const FEATURES = [
  { icon: Mail,      title: "Gmail Integration",    desc: "Emails land in clients' inboxes from your personal Gmail address, building trust." },
  { icon: Cpu,       title: "AI Type Detection",    desc: "Automatically classifies invoices, reminders, updates, and proposals from your input." },
  { icon: FileText,  title: "PDF Upload",           desc: "Drop a PDF — AI extracts the content and writes the email context for you." },
  { icon: Sliders,   title: "Tone Control",         desc: "Choose Friendly, Formal, or Strict. The AI adjusts wording to match your style." },
  { icon: Clock,     title: "Schedule Send",        desc: "Pick a future date and time. MailMind AI delivers the email automatically." },
  { icon: Users,     title: "Client Management",    desc: "Keep a contact book of clients with full email history per client." },
];

const PRICING: { name: string; price: string; period: string; highlight: boolean; comingSoon?: boolean; features: string[]; cta: string }[] = [
  {
    name: "Free", price: "$0", period: "forever", highlight: false,
    features: ["20 emails / day", "5 clients", "Basic AI generation", "Gmail connect"],
    cta: "Get Started",
  },
  {
    name: "Pro", price: "$9.99", period: "/ month", highlight: true,
    features: ["Unlimited emails", "Unlimited clients", "PDF upload & AI detection", "Scheduled delivery", "Full email history", "Tone adjustment"],
    cta: "Start Pro",
  },
  {
    name: "Business", price: "$19.99", period: "/ month", highlight: false, comingSoon: true,
    features: ["Everything in Pro", "Up to 5 team members", "Shared client list", "Email open tracking", "Bulk compose", "Priority support"],
    cta: "Join Waitlist",
  },
];

const TESTIMONIALS = [
  { name: "Ayesha Tariq",   role: "Freelance UI Designer, Lahore",   quote: "I used to spend 30 minutes writing every client email. MailMind AI does it in seconds and it sounds better than what I would write." },
  { name: "Rohan Mehta",    role: "Web Developer, Pune",             quote: "The PDF detection is a game-changer. I upload my invoice and the follow-up email is already written." },
  { name: "Bilal Chaudhry", role: "Digital Marketer, Karachi",       quote: "Scheduling payment reminders used to be stressful. Now I set it once and forget it. My collections improved noticeably." },
];

/* ─── Dashboard mockup ────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div
      className="w-full max-w-3xl mx-auto rounded-2xl overflow-hidden animate-scale-in"
      style={{ border: `1px solid ${BORD}`, boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)" }}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3" style={{ background: "#08080f", borderBottom: `1px solid ${BORD}` }}>
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
        <div className="mx-3 flex-1 rounded-md px-3 py-1 text-xs flex items-center gap-2" style={{ background: SURF, color: SEC }}>
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          app.mailmind.ai/dashboard
        </div>
      </div>

      {/* App shell */}
      <div className="flex h-72" style={{ background: BG }}>
        {/* Sidebar */}
        <div className="w-40 shrink-0 border-r flex flex-col py-4 gap-0.5 px-2.5" style={{ borderColor: BORD, background: "#0D0D14" }}>
          <div className="flex items-center gap-2 px-2 mb-4">
            <div className="h-5 w-5 rounded-md flex items-center justify-center text-[9px] font-black text-white" style={{ background: "var(--a-gradient)" }}>M</div>
            <span className="text-[11px] font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>MailMind AI</span>
          </div>
          {[
            { label: "Dashboard", active: true },
            { label: "Compose", active: false },
            { label: "Clients", active: false },
            { label: "Scheduled", active: false },
            { label: "Settings", active: false },
          ].map(({ label, active }) => (
            <div
              key={label}
              className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
              style={active
                ? { background: `${ACC}22`, color: "var(--a-text)", borderLeft: "2px solid #4f46e5" }
                : { color: "rgba(255,255,255,0.35)", borderLeft: "2px solid transparent" }}
            >
              {label}
            </div>
          ))}
          <div className="mt-auto mx-1 rounded-xl p-2.5" style={{ background: "var(--a-bg)", border: "1px solid rgba(79,70,229,0.25)" }}>
            <p className="text-[9px] font-bold text-indigo-300 mb-1">Free Plan</p>
            <div className="rounded-md py-1 text-center text-[9px] font-bold text-white" style={{ background: "var(--a-gradient)" }}>
              Upgrade ⚡
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold mb-0.5" style={{ color: TXT }}>Welcome back, Ahmed</div>
              <div className="text-[10px]" style={{ color: SEC }}>Your activity overview</div>
            </div>
            <div className="rounded-lg px-3 py-1.5 text-[10px] font-bold text-white" style={{ background: "var(--a-gradient)" }}>
              + Compose
            </div>
          </div>
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: "Emails Sent", value: "24", color: "#3b82f6" },
              { label: "Scheduled", value: "3",  color: "#f59e0b" },
              { label: "Clients",   value: "8",  color: "#10b981" },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-2.5" style={{ background: SURF, border: `1px solid ${BORD}` }}>
                <div className="text-[9px] mb-1" style={{ color: SEC }}>{s.label}</div>
                <div className="text-lg font-extrabold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          {/* Usage ring mini */}
          <div className="rounded-xl p-3 mb-2" style={{ background: SURF, border: `1px solid ${BORD}` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-semibold" style={{ color: SEC }}>Daily Usage</span>
              <span className="text-[9px] font-bold" style={{ color: ACC }}>7 / 20 emails today</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full" style={{ width: "70%", background: "linear-gradient(90deg,#3b82f6,#6366f1)" }} />
            </div>
          </div>
          {/* Activity rows */}
          <div className="rounded-xl overflow-hidden" style={{ background: SURF, border: `1px solid ${BORD}` }}>
            {[{ name: "Sarah Johnson", type: "Invoice" }, { name: "Mike Chen", type: "Follow-up" }].map((r, i) => (
              <div key={r.name} className="flex items-center justify-between px-3 py-2 text-[10px]" style={{ borderTop: i > 0 ? `1px solid ${BORD}` : "none" }}>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                    {r.name[0]}
                  </div>
                  <span style={{ color: TXT }}>{r.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full px-1.5 py-0.5" style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", fontSize: "8px" }}>Sent</span>
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>{r.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div style={{
      backgroundColor: BG,
      color: TXT,
      minHeight: "100vh",
      backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
      backgroundSize: "60px 60px",
    }}>
      <MarketingNav />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-24 pb-20 text-center overflow-hidden">
        {/* Starfield background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px), radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "90px 90px, 35px 35px",
            backgroundPosition: "0 0, 45px 18px",
          }} />
          {/* Static ambient orbs — no animation for performance */}
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full opacity-25 blur-[120px]"
            style={{ background: "radial-gradient(circle,#4f46e5,transparent 65%)" }} />
          <div className="absolute top-60 -left-32 h-[380px] w-[380px] rounded-full opacity-15 blur-[100px]"
            style={{ background: "radial-gradient(circle,#2563eb,transparent 65%)" }} />
          <div className="absolute top-40 -right-32 h-[380px] w-[380px] rounded-full opacity-15 blur-[100px]"
            style={{ background: "radial-gradient(circle,#7c3aed,transparent 65%)" }} />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 h-[200px] w-[500px] rounded-full opacity-10 blur-[80px]"
            style={{ background: "radial-gradient(ellipse,#6366f1,transparent 70%)" }} />
        </div>

        <div
          className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium animate-fade-in-up animate-badge-glow"
          style={{ borderColor: "rgba(99,102,241,0.4)", color: "#a5b4fc", background: "rgba(99,102,241,0.1)" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          Free plan available — no credit card required
        </div>

        <h1
          className="mx-auto mb-6 max-w-3xl text-4xl sm:text-6xl font-bold leading-tight animate-fade-in-up delay-100"
          style={{ color: TXT, letterSpacing: "-0.03em" }}
        >
          Your Work. Your Email.{" "}
          <span className="gradient-text glow-text animate-text-glow">AI-Powered.</span>
        </h1>

        <p className="mx-auto mb-10 max-w-xl text-base sm:text-lg leading-relaxed animate-fade-in-up delay-200" style={{ color: SEC }}>
          Describe your work, upload a PDF, or paste your notes — MailMind AI writes a
          professional email and sends it from your own Gmail in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up delay-300">
          <Link
            href="/auth/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-white transition-all animate-btn-glow"
            style={{ background: "var(--a-gradient)" }}
          >
            Get Started Free <ChevronRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border px-7 py-3.5 text-sm font-medium transition-all hover:-translate-y-0.5"
            style={{ borderColor: "rgba(255,255,255,0.12)", color: SEC, background: "rgba(255,255,255,0.04)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(99,102,241,0.5)";
              (e.currentTarget as HTMLAnchorElement).style.color = TXT;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.12)";
              (e.currentTarget as HTMLAnchorElement).style.color = SEC;
            }}
          >
            See Features
          </a>
        </div>

        {/* Trust bar */}
        <div className="mt-10 flex items-center justify-center gap-6 animate-fade-in-up delay-400">
          {["No credit card", "Cancel anytime", "Gmail-native sending"].map(t => (
            <span key={t} className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              <Check className="h-3 w-3" style={{ color: "#22c55e" }} />
              {t}
            </span>
          ))}
        </div>

        <div className="mt-14 animate-fade-in-up delay-500">
          <DashboardMockup />
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-y" style={{ borderColor: BORD }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="gradient-text text-2xl sm:text-3xl font-semibold mb-3" style={{ letterSpacing: "-0.02em" }}>
              How It Works
            </h2>
            <p className="text-sm" style={{ color: SEC }}>Four steps from description to delivered email.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(({ icon: Icon, step, title, desc }, i) => (
              <div
                key={step}
                className="rounded-2xl p-5 flex flex-col gap-3 neon-card animate-fade-in-up"
                style={{ background: SURF, animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl animate-icon-glow" style={{ background: `${ACC}20` }}>
                    <Icon className="h-5 w-5" style={{ color: ACC }} />
                  </div>
                  <span className="text-lg font-black" style={{ color: `${ACC}80` }}>{step}</span>
                </div>
                <p className="text-sm font-bold" style={{ color: TXT }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: SEC }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="gradient-text text-2xl sm:text-3xl font-semibold mb-3" style={{ letterSpacing: "-0.02em" }}>
              Everything You Need
            </h2>
            <p className="text-sm" style={{ color: SEC }}>Built specifically for South Asian freelancers and small teams.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="rounded-2xl p-6 neon-card animate-fade-in-up"
                style={{ background: SURF, animationDelay: `${i * 80}ms` }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl animate-icon-glow" style={{ background: `${ACC}18` }}>
                  <Icon className="h-5 w-5" style={{ color: ACC }} />
                </div>
                <p className="mb-2 text-sm font-bold" style={{ color: TXT }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: SEC }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-4 sm:px-6 border-t" style={{ borderColor: BORD }}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="gradient-text text-2xl sm:text-3xl font-semibold mb-3" style={{ letterSpacing: "-0.02em" }}>
              Simple Pricing
            </h2>
            <p className="text-sm" style={{ color: SEC }}>No hidden fees. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">
            {PRICING.map((plan, i) => (
              <div
                key={plan.name}
                className={`rounded-2xl flex flex-col ${plan.highlight ? "animate-pro-entry-glow" : "animate-fade-in-up neon-card"}`}
                style={{
                  padding: plan.highlight ? "28px 24px" : "24px",
                  background: plan.comingSoon ? "rgba(255,255,255,0.02)" : plan.highlight ? `${ACC}12` : SURF,
                  border: plan.highlight ? "1px solid rgba(99,102,241,0.65)" : undefined,
                  animationDelay: plan.highlight ? undefined : `${i * 100}ms`,
                  opacity: plan.comingSoon ? 0.75 : 1,
                }}
              >
                {plan.highlight && (
                  <span
                    className="mb-3 self-start rounded-full px-3 py-1 text-xs font-bold"
                    style={{ background: "var(--a-gradient)", color: "#fff" }}
                  >
                    ⚡ Most Popular
                  </span>
                )}
                {plan.comingSoon && (
                  <span
                    className="mb-3 self-start rounded-full px-3 py-1 text-xs font-bold"
                    style={{ background: "rgba(245,158,11,0.12)", color: "#d97706", border: "1px solid rgba(245,158,11,0.3)" }}
                  >
                    Coming Soon
                  </span>
                )}
                <p className="text-base font-bold mb-1" style={{ color: TXT }}>{plan.name}</p>
                <div className="mb-5 flex items-end gap-1">
                  <span className="text-4xl font-black" style={{ color: plan.highlight ? "var(--a-text)" : TXT }}>{plan.price}</span>
                  <span className="text-sm mb-1" style={{ color: SEC }}>{plan.period}</span>
                </div>
                <ul className="flex-1 space-y-3 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: SEC }}>
                      <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: plan.comingSoon ? "#94a3b8" : "#22c55e" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.comingSoon ? (
                  <a
                    href="mailto:itzhakeem1725@gmail.com?subject=MailMind AI Business Plan Waitlist"
                    className="block rounded-xl py-3 text-center text-sm font-bold transition-all hover:-translate-y-0.5"
                    style={{
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.35)",
                      color: "#d97706",
                    }}
                  >
                    Join Waitlist →
                  </a>
                ) : (
                  <Link
                    href="/auth/signup"
                    className="block rounded-xl py-3 text-center text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                    style={{
                      background: plan.highlight ? "var(--a-gradient)" : "rgba(255,255,255,0.06)",
                      boxShadow: plan.highlight ? "0 8px 24px rgba(79,70,229,0.45)" : "none",
                      border: plan.highlight ? "none" : `1px solid ${BORD}`,
                    }}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-t" style={{ borderColor: BORD }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="gradient-text text-2xl sm:text-3xl font-semibold mb-3" style={{ letterSpacing: "-0.02em" }}>
              What Freelancers Say
            </h2>
            <p className="text-sm" style={{ color: SEC }}>Real feedback from South Asian professionals.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, role, quote }) => (
              <div key={name} className="rounded-xl p-6 flex flex-col gap-4 neon-card" style={{ background: SURF }}>
                <Quote className="h-5 w-5 shrink-0" style={{ color: ACC }} />
                <p className="flex-1 text-sm leading-relaxed" style={{ color: SEC }}>{quote}</p>
                <div>
                  <p className="text-sm font-semibold" style={{ color: TXT }}>{name}</p>
                  <p className="text-xs" style={{ color: SEC }}>{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────── */}
      <section className="relative py-20 px-4 sm:px-6 border-t text-center overflow-hidden" style={{ borderColor: BORD }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full opacity-20 blur-3xl animate-float"
            style={{ background: "radial-gradient(ellipse,#4f46e5,transparent 70%)" }} />
        </div>
        <div className="relative mx-auto max-w-xl">
          <Inbox className="mx-auto mb-4 h-12 w-12 animate-neon-pulse" style={{ color: ACC }} />
          <h2 className="gradient-text text-2xl sm:text-3xl font-semibold mb-4" style={{ letterSpacing: "-0.02em" }}>
            Start Sending Smarter
          </h2>
          <p className="mb-8 text-sm leading-relaxed" style={{ color: SEC }}>
            Join freelancers across Pakistan and India who are saving hours every week
            with AI-written, Gmail-sent professional emails.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-white transition-all animate-btn-glow"
            style={{ background: "var(--a-gradient)" }}
          >
            Get Started Free <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

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

const PRICING = [
  {
    name: "Free", price: "Rs. 0", period: "forever", highlight: false,
    features: ["10 emails / month", "3 clients", "Basic AI generation", "Gmail connect"],
    cta: "Get Started",
  },
  {
    name: "Pro", price: "Rs. 999", period: "/ month", highlight: true,
    features: ["Unlimited emails", "Unlimited clients", "PDF upload & AI detection", "Scheduled delivery", "Full email history", "Tone adjustment"],
    cta: "Start Pro",
  },
  {
    name: "Business", price: "Rs. 2,499", period: "/ month", highlight: false,
    features: ["Everything in Pro", "Up to 5 team members", "Priority support", "Advanced analytics", "Custom email signature"],
    cta: "Start Business",
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
      className="w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-2xl"
      style={{ border: `1px solid ${BORD}` }}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3" style={{ background: "#0D0D14" }}>
        <span className="h-3 w-3 rounded-full bg-red-500/70" />
        <span className="h-3 w-3 rounded-full bg-amber-400/70" />
        <span className="h-3 w-3 rounded-full bg-green-500/70" />
        <div className="mx-3 flex-1 rounded px-3 py-1 text-xs" style={{ background: SURF, color: SEC }}>
          app.mailmind.ai/dashboard
        </div>
      </div>

      {/* App shell */}
      <div className="flex h-56" style={{ background: BG }}>
        {/* Sidebar */}
        <div className="w-36 shrink-0 border-r flex flex-col py-3 gap-1 px-2" style={{ borderColor: BORD, background: "#0D0D14" }}>
          {["Dashboard", "Compose", "Clients", "Scheduled", "Settings"].map((label, i) => (
            <div
              key={label}
              className="rounded-lg px-2 py-1.5 text-xs font-medium"
              style={i === 0
                ? { background: `${ACC}22`, color: "#818cf8" }
                : { color: SEC }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-4">
          <div className="mb-3 text-xs font-semibold" style={{ color: TXT }}>Dashboard</div>
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: "Sent", value: "24" },
              { label: "Scheduled", value: "3" },
              { label: "Clients", value: "8" },
            ].map(s => (
              <div key={s.label} className="rounded-lg p-2" style={{ background: SURF, border: `1px solid ${BORD}` }}>
                <div className="text-xs mb-1" style={{ color: SEC }}>{s.label}</div>
                <div className="text-base font-bold" style={{ color: TXT }}>{s.value}</div>
              </div>
            ))}
          </div>
          {/* Activity rows */}
          <div className="rounded-lg overflow-hidden" style={{ background: SURF, border: `1px solid ${BORD}` }}>
            {["Ayesha Tariq", "Rohan Mehta"].map((name, i) => (
              <div key={name} className="flex items-center justify-between px-3 py-2 text-xs" style={{ borderTop: i > 0 ? `1px solid ${BORD}` : "none" }}>
                <span style={{ color: SEC }}>{name}</span>
                <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: `${ACC}22`, color: "#818cf8" }}>Sent</span>
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
    <div style={{ background: BG, color: TXT, minHeight: "100vh" }}>
      <MarketingNav />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-20 pb-16 text-center">
        <div
          className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium"
          style={{ borderColor: BORD, color: SEC }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          Free plan available — no credit card required
        </div>

        <h1
          className="mx-auto mb-6 max-w-3xl text-4xl sm:text-6xl font-semibold leading-tight"
          style={{ color: TXT, letterSpacing: "-0.02em" }}
        >
          Your Work. Your Email.{" "}
          <span style={{ color: ACC }}>AI-Powered.</span>
        </h1>

        <p className="mx-auto mb-10 max-w-xl text-base sm:text-lg leading-relaxed" style={{ color: SEC }}>
          Describe your work, upload a PDF, or paste your notes — MailMind AI writes a
          professional email and sends it from your own Gmail in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/auth/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white transition-colors"
            style={{ background: ACC }}
            onMouseEnter={e => (e.currentTarget.style.background = "#4F46E5")}
            onMouseLeave={e => (e.currentTarget.style.background = ACC)}
          >
            Get Started Free <ChevronRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border px-6 py-3 text-sm font-medium transition-colors"
            style={{ borderColor: BORD, color: SEC }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "#6366F1";
              (e.currentTarget as HTMLAnchorElement).style.color = TXT;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = BORD;
              (e.currentTarget as HTMLAnchorElement).style.color = SEC;
            }}
          >
            See Features
          </a>
        </div>

        <div className="mt-14">
          <DashboardMockup />
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-y" style={{ borderColor: BORD }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-3" style={{ color: TXT, letterSpacing: "-0.02em" }}>
              How It Works
            </h2>
            <p className="text-sm" style={{ color: SEC }}>Four steps from description to delivered email.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="rounded-xl p-5 flex flex-col gap-3" style={{ background: SURF, border: `1px solid ${BORD}` }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: `${ACC}20` }}>
                    <Icon className="h-4 w-4" style={{ color: ACC }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: ACC }}>{step}</span>
                </div>
                <p className="text-sm font-semibold" style={{ color: TXT }}>{title}</p>
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
            <h2 className="text-2xl sm:text-3xl font-semibold mb-3" style={{ color: TXT, letterSpacing: "-0.02em" }}>
              Everything You Need
            </h2>
            <p className="text-sm" style={{ color: SEC }}>Built specifically for South Asian freelancers and small teams.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl p-5 transition-colors"
                style={{ background: SURF, border: `1px solid ${BORD}` }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#6366F1")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = BORD)}
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${ACC}20` }}>
                  <Icon className="h-4 w-4" style={{ color: ACC }} />
                </div>
                <p className="mb-1.5 text-sm font-semibold" style={{ color: TXT }}>{title}</p>
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
            <h2 className="text-2xl sm:text-3xl font-semibold mb-3" style={{ color: TXT, letterSpacing: "-0.02em" }}>
              Simple Pricing
            </h2>
            <p className="text-sm" style={{ color: SEC }}>No hidden fees. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {PRICING.map(plan => (
              <div
                key={plan.name}
                className="rounded-xl p-6 flex flex-col"
                style={{
                  background: plan.highlight ? `${ACC}10` : SURF,
                  border: `1px solid ${plan.highlight ? ACC : BORD}`,
                  boxShadow: plan.highlight ? `0 0 32px ${ACC}22` : "none",
                }}
              >
                {plan.highlight && (
                  <span
                    className="mb-3 self-start rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ background: ACC, color: "#fff" }}
                  >
                    Most Popular
                  </span>
                )}
                <p className="text-sm font-semibold mb-1" style={{ color: TXT }}>{plan.name}</p>
                <div className="mb-5">
                  <span className="text-3xl font-bold" style={{ color: TXT }}>{plan.price}</span>
                  <span className="text-sm ml-1" style={{ color: SEC }}>{plan.period}</span>
                </div>
                <ul className="flex-1 space-y-2.5 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs" style={{ color: SEC }}>
                      <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup"
                  className="block rounded-lg py-2.5 text-center text-sm font-medium text-white transition-colors"
                  style={{ background: plan.highlight ? ACC : "#1E1E2A" }}
                  onMouseEnter={e => (e.currentTarget.style.background = plan.highlight ? "#4F46E5" : "#2a2a38")}
                  onMouseLeave={e => (e.currentTarget.style.background = plan.highlight ? ACC : "#1E1E2A")}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-t" style={{ borderColor: BORD }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-3" style={{ color: TXT, letterSpacing: "-0.02em" }}>
              What Freelancers Say
            </h2>
            <p className="text-sm" style={{ color: SEC }}>Real feedback from South Asian professionals.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, role, quote }) => (
              <div key={name} className="rounded-xl p-6 flex flex-col gap-4" style={{ background: SURF, border: `1px solid ${BORD}` }}>
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
      <section className="py-20 px-4 sm:px-6 border-t text-center" style={{ borderColor: BORD }}>
        <div className="mx-auto max-w-xl">
          <Inbox className="mx-auto mb-4 h-10 w-10" style={{ color: ACC }} />
          <h2 className="text-2xl sm:text-3xl font-semibold mb-4" style={{ color: TXT, letterSpacing: "-0.02em" }}>
            Start Sending Smarter
          </h2>
          <p className="mb-8 text-sm leading-relaxed" style={{ color: SEC }}>
            Join freelancers across Pakistan and India who are saving hours every week
            with AI-written, Gmail-sent professional emails.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white transition-colors"
            style={{ background: ACC }}
            onMouseEnter={e => (e.currentTarget.style.background = "#4F46E5")}
            onMouseLeave={e => (e.currentTarget.style.background = ACC)}
          >
            Get Started Free <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

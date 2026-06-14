"use client";

import Link from "next/link";
import { Heart, Zap, ShieldCheck, ChevronRight } from "lucide-react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

const BG   = "#0A0A0F";
const SURF = "#111118";
const BORD = "#1E1E2A";
const ACC  = "#6366F1";
const TXT  = "#F8F8FF";
const SEC  = "#9CA3AF";

const VALUES = [
  { icon: Zap,         title: "Simple",     desc: "Every feature exists to remove friction, not add it. If it doesn't make your work easier in 30 seconds, we don't ship it." },
  { icon: ShieldCheck, title: "Trustworthy", desc: "Your Gmail credentials are encrypted with AES-256. We never read your emails. Send-only access, always." },
  { icon: Heart,       title: "Fast",       desc: "AI generation under 10 seconds. Scheduling takes one click. We respect your time — that's why we built this." },
];

const TEAM = [
  { name: "Abdul Hakeem",   role: "Founder & Full-Stack Engineer" },
  { name: "Product Team",   role: "Design & Growth" },
];

export default function AboutPage() {
  return (
    <div style={{ background: BG, color: TXT, minHeight: "100vh" }}>
      <MarketingNav />

      <div className="mx-auto max-w-4xl px-4 sm:px-6">

        {/* ── Mission ─────────────────────────────────────────── */}
        <section className="py-20 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: ACC }}>
            Our Mission
          </p>
          <h1 className="text-3xl sm:text-5xl font-semibold leading-tight mb-6" style={{ color: TXT, letterSpacing: "-0.02em" }}>
            We built MailMind AI for South Asian freelancers who spend hours writing the same professional emails.
          </h1>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: SEC }}>
            We believe your time is worth more than that.
          </p>
        </section>

        {/* ── Problem → Solution ──────────────────────────────── */}
        <section className="pb-20 border-t pt-16" style={{ borderColor: BORD }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="rounded-xl p-6" style={{ background: SURF, border: `1px solid ${BORD}` }}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "#ef4444" }}>
                The Problem
              </p>
              <h2 className="text-lg font-semibold mb-3" style={{ color: TXT }}>
                Writing emails is killing your productivity
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: SEC }}>
                Freelancers in Pakistan and India spend 2–4 hours per week writing the same types of client emails — payment reminders, project updates, invoice follow-ups. It is repetitive, anxiety-inducing, and takes time away from actual work.
              </p>
            </div>
            <div className="rounded-xl p-6" style={{ background: `${ACC}0A`, border: `1px solid ${ACC}40` }}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "#22c55e" }}>
                The Solution
              </p>
              <h2 className="text-lg font-semibold mb-3" style={{ color: TXT }}>
                Describe it once. AI writes it. Gmail sends it.
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: SEC }}>
                MailMind AI reads your context — a PDF, a few typed lines, or a project name — detects what kind of email is needed, and generates a professional, tone-matched message. You review, approve, and send. Under 60 seconds start to finish.
              </p>
            </div>
          </div>
        </section>

        {/* ── Values ──────────────────────────────────────────── */}
        <section className="pb-20 border-t pt-16" style={{ borderColor: BORD }}>
          <h2 className="text-2xl font-semibold mb-10 text-center" style={{ color: TXT, letterSpacing: "-0.02em" }}>
            What We Stand For
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl p-6" style={{ background: SURF, border: `1px solid ${BORD}` }}>
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${ACC}20` }}>
                  <Icon className="h-4 w-4" style={{ color: ACC }} />
                </div>
                <p className="text-sm font-semibold mb-2" style={{ color: TXT }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: SEC }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Team ────────────────────────────────────────────── */}
        <section className="pb-20 border-t pt-16" style={{ borderColor: BORD }}>
          <h2 className="text-2xl font-semibold mb-3 text-center" style={{ color: TXT, letterSpacing: "-0.02em" }}>
            Built By
          </h2>
          <p className="text-sm text-center mb-10" style={{ color: SEC }}>
            A small team obsessed with freelancer productivity.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {TEAM.map(({ name, role }) => (
              <div
                key={name}
                className="rounded-xl px-6 py-4 text-center"
                style={{ background: SURF, border: `1px solid ${BORD}`, minWidth: "180px" }}
              >
                <div
                  className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: ACC }}
                >
                  {name[0]}
                </div>
                <p className="text-sm font-semibold" style={{ color: TXT }}>{name}</p>
                <p className="text-xs mt-0.5" style={{ color: SEC }}>{role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <section className="pb-20 border-t pt-16 text-center" style={{ borderColor: BORD }}>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: TXT, letterSpacing: "-0.02em" }}>
            Start Free Today
          </h2>
          <p className="text-sm mb-8" style={{ color: SEC }}>
            No credit card required. 10 emails free every month, forever.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white transition-colors"
            style={{ background: ACC }}
            onMouseEnter={e => (e.currentTarget.style.background = "#4F46E5")}
            onMouseLeave={e => (e.currentTarget.style.background = ACC)}
          >
            Create Free Account <ChevronRight className="h-4 w-4" />
          </Link>
        </section>
      </div>

      <MarketingFooter />
    </div>
  );
}

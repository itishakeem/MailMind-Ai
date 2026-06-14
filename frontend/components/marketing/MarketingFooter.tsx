"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

const LINKS = {
  Product: [
    { label: "Features",  href: "/#features" },
    { label: "Pricing",   href: "/#pricing" },
  ],
  Company: [
    { label: "About",    href: "/about" },
    { label: "Contact",  href: "/contact" },
  ],
  Legal: [
    { label: "Privacy",  href: "/privacy" },
    { label: "Terms",    href: "/terms" },
  ],
};

export default function MarketingFooter() {
  return (
    <footer className="border-t" style={{ borderColor: "#1E1E2A", background: "#0A0A0F" }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "#6366F1" }}>
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold" style={{ color: "#F8F8FF" }}>MailMind AI</span>
            </Link>
            <p className="text-xs leading-relaxed" style={{ color: "#9CA3AF" }}>
              Professional emails from your own Gmail, powered by AI.
            </p>
          </div>

          {/* Link groups */}
          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>
                {group}
              </p>
              <ul className="space-y-2">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm transition-colors"
                      style={{ color: "#9CA3AF" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#F8F8FF")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: "#1E1E2A" }}>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            &copy; {new Date().getFullYear()} MailMind AI. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            Built for South Asian freelancers &amp; businesses.
          </p>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Pricing",  href: "/#pricing" },
  { label: "About",    href: "/about" },
  { label: "Contact",  href: "/contact" },
];

export default function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 w-full border-b"
      style={{ background: "rgba(10,10,15,0.85)", borderColor: "#1E1E2A", backdropFilter: "blur(16px)" }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/logo.png"
            alt="MailMind AI"
            width={32}
            height={32}
            className="rounded-lg transition-opacity group-hover:opacity-80"
          />
          <span className="text-base font-semibold tracking-tight" style={{ color: "#F8F8FF" }}>
            MailMind AI
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-sm font-medium transition-colors"
              style={{ color: pathname === href ? "#F8F8FF" : "#9CA3AF" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#F8F8FF")}
              onMouseLeave={e => (e.currentTarget.style.color = pathname === href ? "#F8F8FF" : "#9CA3AF")}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm font-medium transition-colors"
            style={{ color: "#9CA3AF" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#F8F8FF")}
            onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ background: "#6366F1" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--a-to)")}
            onMouseLeave={e => (e.currentTarget.style.background = "#6366F1")}
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden rounded-lg p-2 transition-colors"
          style={{ color: "#9CA3AF" }}
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="md:hidden border-t px-4 pb-4 pt-3" style={{ borderColor: "#1E1E2A", background: "#0A0A0F" }}>
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                style={{ color: "#9CA3AF" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "#F8F8FF";
                  (e.currentTarget as HTMLAnchorElement).style.background = "#111118";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "#9CA3AF";
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                }}
              >
                {label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t pt-3" style={{ borderColor: "#1E1E2A" }}>
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-center text-sm font-medium transition-colors"
                style={{ color: "#9CA3AF", border: "1px solid #1E1E2A" }}
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-white transition-colors"
                style={{ background: "#6366F1" }}
              >
                Get Started Free
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

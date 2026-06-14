# Feature Specification: Public Marketing Pages

**Feature**: `003-public-pages`
**Created**: 2026-06-13
**Status**: Active

## Overview

Three public-facing marketing pages (/, /about, /contact) built with a unified dark design system and shared navigation/footer components. These pages are accessible without authentication and serve as the product's marketing site.

## Design System (authoritative)

| Token | Value |
|-------|-------|
| Background | `#0A0A0F` |
| Surface | `#111118` |
| Border | `#1E1E2A` |
| Accent | `#6366F1` |
| Accent hover | `#4F46E5` |
| Text primary | `#F8F8FF` |
| Text secondary | `#9CA3AF` |
| Font | Inter (Google Fonts, already loaded in layout.tsx) |
| Heading weight | 600, tracking -0.02em |
| Cards | `rounded-xl border border-[#1E1E2A] bg-[#111118]` |
| Buttons | `rounded-lg px-4 py-2 font-medium transition-colors` |
| Icons | Lucide React only — zero emojis in UI |
| Animations | `transition-colors`, `transition-opacity` only |

## Pages

### Page 1 — Homepage `/`

**Navbar**: Logo left · links (Features, Pricing, About, Contact) · "Get Started" CTA right · mobile hamburger (sheet drawer).

**Hero**: Large heading "Your Work. Your Email. AI-Powered." · subtext · two CTAs (Get Started Free, See Features) · browser-frame mockup of the dashboard UI built in HTML/CSS (no real screenshot).

**How It Works**: 4-step numbered flow — Describe Work → AI Detects Type → Email Generated → Sent from Gmail. Each step has a Lucide icon and one-line description.

**Features grid**: 6 cards — Gmail Integration, AI Detection, PDF Upload, Tone Control, Schedule Send, Client Management. Each has a Lucide icon.

**Pricing**: 3 cards — Free (Rs. 0), Pro (Rs. 999/mo), Business (Rs. 2,499/mo). Pro card is highlighted with accent border. Feature lists with Check icons. CTA links to /auth/signup.

**Testimonials**: 3 placeholder cards with name, role (Pakistani/Indian freelancers), quote text. Uses Quote icon. Static data only.

**Footer**: Logo + tagline · link groups (Product: Features, Pricing; Company: About, Contact; Legal: Privacy, Terms) · copyright.

### Page 2 — About `/about`

- Mission statement section with large pull quote.
- Problem → Solution: two-column card layout.
- Values: 3 cards (Simple, Fast, Trustworthy) with Lucide icons.
- Team: "A small team obsessed with freelancer productivity" — text-only cards with name + role.
- CTA: "Start Free Today" → /auth/signup.

### Page 3 — Contact `/contact`

- No sidebar, centered max-w-xl layout.
- Form: Name · Email · Subject (select: General / Bug Report / Feature Request / Partnership) · Message (textarea) · Submit.
- On submit: POST /api/contact → validates → stores submission + attempts Gmail send.
- Below form: support email + "We reply within 24 hours" note.
- No phone numbers, no office address.

## API

### POST /api/contact

**Input**: `{ name: string, email: string, subject: string, message: string }`

**Validation**:
- name: 1–100 chars
- email: valid format
- subject: one of ["General", "Bug Report", "Feature Request", "Partnership"]
- message: 10–2000 chars

**Behaviour**: Validate → store in `contacts` Supabase table (service role, public submission) → attempt Gmail send via `APP_GMAIL_REFRESH_TOKEN` env var if present → always return 200 (prevent enumeration).

**Errors**: Return 400 for validation failures with field-level messages.

## Acceptance Criteria

- AC-001: All three pages render at 375px with no horizontal overflow.
- AC-002: Navbar "Get Started" links to /auth/signup on all three pages.
- AC-003: Contact form validates all fields client-side before submit; shows inline errors.
- AC-004: Contact form shows success state after submit; fields reset.
- AC-005: TypeScript clean — tsc --noEmit zero errors.
- AC-006: No emojis anywhere in the three pages.
- AC-007: All icons are from lucide-react.
- AC-008: Background colour on all three pages matches #0A0A0F.

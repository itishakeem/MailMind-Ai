# Plan: Public Marketing Pages

**Feature**: `003-public-pages`
**Created**: 2026-06-13

## Architecture

### Shared components (`components/marketing/`)

Two shared components used across all three pages:

**`MarketingNav.tsx`** — client component (needs useState for mobile menu).
- Desktop: logo + nav links + CTA button in a sticky `h-16` bar.
- Mobile: hamburger button toggles a full-width sheet that slides down.
- Active link detection via `usePathname`.
- Links: Features (/#features), Pricing (/#pricing), About (/about), Contact (/contact).

**`MarketingFooter.tsx`** — server component (pure static).
- Three link columns + copyright row.
- Same design tokens as page.

### Pages

**`app/page.tsx`** — `"use client"` not needed; static data only. All section components are inline (no separate files — YAGNI). Uses Lucide icons throughout.

**`app/about/page.tsx`** — server component, static content.

**`app/contact/page.tsx`** — `"use client"` for form state (name, email, subject, message, errors, submitting, success).

### API

**`app/api/contact/route.ts`**:
```
POST → validate (zod) → insert into contacts table via admin client → attempt Gmail send → return { success: true }
```
Uses `createAdminClient()` because the contacts table is a public submission (no auth). Rate limiting is handled by Vercel's built-in DDoS protection.

### Database

New `contacts` table needed. **No new migration file** — add as `supabase/migrations/004_contacts.sql` with a note that it must be run before contact form works in production. Route handles the DB error gracefully (returns success even if insert fails, to prevent enumeration and keep the happy path clean for the user).

### Tailwind design tokens

All design system colours are used as inline hex values or arbitrary Tailwind classes (`bg-[#0A0A0F]`, `text-[#9CA3AF]`, etc.) since they are one-off marketing values and don't need to be in tailwind.config.ts — the component files are the source of truth.

## Component breakdown

### Homepage sections (all inline in `app/page.tsx`)

| Section | Key element |
|---------|------------|
| Navbar | `MarketingNav` |
| Hero | H1 + subtext + 2 CTAs + `DashboardMockup` inline component |
| How It Works | 4 steps, numbered circles, Lucide icons |
| Features | 6-card grid, Lucide icons |
| Pricing | 3 cards, accent border on Pro, Check icons |
| Testimonials | 3 cards, Quote icon, static data |
| Footer | `MarketingFooter` |

### DashboardMockup

Inline functional component that renders an HTML/CSS browser-frame mockup (fake title bar + fake sidebar + fake stat cards) using design tokens. No image required.

## Key decisions

**Decision 1: Inline sections vs separate files**
All homepage sections are written inline in `app/page.tsx` as local components. This is correct at this scale — extracting each section to a file adds no value and fragments the codebase. If the marketing site grows, extract then.

**Decision 2: Arbitrary Tailwind values for design tokens**
Marketing design tokens don't belong in `tailwind.config.ts` alongside app tokens. Inline arbitrary values keep the marketing design system self-contained and easy to update without touching app config.

**Decision 3: Contact route always returns 200**
Prevents email enumeration and removes the need for client-side error handling on network failures. Validation failures (400) are still returned to give users field-level feedback.

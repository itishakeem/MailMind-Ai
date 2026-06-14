---
description: "Tasks for public marketing pages (/, /about, /contact)"
---

# Tasks: Public Marketing Pages

**Spec**: specs/003-public-pages/spec.md
**Plan**: specs/003-public-pages/plan.md

---

## Phase 1: Foundation

- [x] P001 Install lucide-react: `npm install lucide-react`
- [x] P002 Create `supabase/migrations/004_contacts.sql` — contacts table schema
- [x] P003 Create `components/marketing/MarketingNav.tsx` — sticky navbar, mobile sheet
- [x] P004 Create `components/marketing/MarketingFooter.tsx` — footer with link groups

## Phase 2: Homepage

- [x] P005 Rewrite `app/page.tsx` — Hero section with DashboardMockup
- [x] P006 Add How It Works section (4 steps, Lucide icons)
- [x] P007 Add Features grid (6 cards)
- [x] P008 Add Pricing section (3 cards, Pro highlighted)
- [x] P009 Add Testimonials section (3 cards, static)

## Phase 3: About + Contact

- [x] P010 Create `app/about/page.tsx` — mission, problem/solution, values, team, CTA
- [x] P011 Create `app/contact/page.tsx` — form with client-side validation + success state
- [x] P012 Create `app/api/contact/route.ts` — validate, store, attempt send, return 200

## Phase 4: Verify

- [x] P013 `tsc --noEmit` — zero errors
- [x] P014 All pages return 200 at localhost
- [x] P015 No emojis in any of the three pages

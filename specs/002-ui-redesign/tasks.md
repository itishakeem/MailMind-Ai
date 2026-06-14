---
description: "Implementation tasks for MailMind AI — Professional UI Redesign with Animations"
---

# Tasks: MailMind AI — Professional UI Redesign

**Input**: Design documents from `/specs/002-ui-redesign/`
**Prerequisites**: spec.md ✅ | plan.md ✅
**Branch**: `002-ui-redesign`
**Stack**: Next.js 14 App Router, Tailwind CSS, CSS Animations

---

## Phase 1: Animation Foundation

- [x] U001 Update `app/globals.css`: add @keyframes (fadeInUp, fadeIn, gradientShift, float, pulseGlow), utility classes (.glass, .glass-dark, .gradient-text, .card-hover, .animate-fade-in-up, .animate-float, .animate-gradient, stagger delay classes)
- [x] U002 Update `tailwind.config.ts`: extend animation/keyframes config, add slate/indigo/violet colors, add backgroundImage.hero-gradient

---

## Phase 2: Public Surface (Landing + Auth)

- [x] U003 Redesign `app/page.tsx`: dark hero with animated orbs, gradient headline, stats bar, glassmorphism feature cards, pricing with glow highlight, footer
- [x] U004 Redesign `app/auth/layout.tsx`: full-screen gradient background, glass card with backdrop-blur, gradient logo mark
- [x] U005 Polish `components/auth/LoginForm.tsx`: dark inputs (white/5 bg), gradient submit button, animated error state
- [x] U006 Polish `components/auth/SignupForm.tsx`: same input treatment as LoginForm

---

## Phase 3: Dashboard Shell (Navbar + Sidebar + Layout)

- [x] U007 Redesign `components/layout/Navbar.tsx`: blur backdrop, gradient logo mark, polished Gmail status pill, plan badge refinement
- [x] U008 Redesign `components/layout/Sidebar.tsx`: slate-900 dark bg, gradient active state with left border accent, hover animations
- [x] U009 Update `app/(dashboard)/layout.tsx`: adjust background to work with dark sidebar

---

## Phase 4: Dashboard Content

- [x] U010 Upgrade `components/dashboard/StatCard.tsx`: left gradient accent bar, icon support, hover lift with shadow
- [x] U011 Update `app/(dashboard)/dashboard/page.tsx`: pass icons/colors to StatCards, add staggered entrance animations to each section

---

## Notes

- All new StatCard props (icon, accentColor) are optional — zero breaking changes
- Landing page requires "use client" for isVisible entrance animation trigger
- Animation delays use inline style={{ animationDelay }} to avoid Tailwind JIT purge
- Sidebar dark bg (#0f172a) pairs with light main area (bg-gray-50) for clear hierarchy

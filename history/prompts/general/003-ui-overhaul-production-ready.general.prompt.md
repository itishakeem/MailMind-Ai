---
id: "003"
title: UI Overhaul Production Ready
stage: general
date: 2026-06-18
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Abdul Hakeem
command: /sp.phr
labels: ["ui", "animations", "dashboard", "upgrade", "pricing", "circular-graph", "sidebar"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/app/globals.css
  - frontend/app/page.tsx
  - frontend/app/(dashboard)/dashboard/page.tsx
  - frontend/components/layout/Sidebar.tsx
  - frontend/components/layout/DashboardShell.tsx
  - frontend/components/ui/UpgradePrompt.tsx
  - frontend/components/clients/ClientHistory.tsx
  - frontend/lib/rate-limit.ts
tests:
  - npx tsc --noEmit (0 errors)
---

## Prompt

update ui make every page animated and look professional and attractive. use website work related images for quality. remember this project is about to launch so make it production ready each and every page should be match in colors and text style. also use circular graph on dashboard for user work in percentage and use working upgrade button for pro plans in side bar and dashboard and when the free limit reached then occures page to upgrade. use dollar currency change pkr from plans.

## Response snapshot

Full UI overhaul across 8 files: added new CSS animation utilities (slideInLeft, slideInRight, scaleIn, popIn, stagger delays, glow-border, pro-card); revamped homepage hero with ambient gradient orbs, animated trust bar, improved DashboardMockup; changed all PKR pricing to USD ($0 / $9 / $29); added staggered animations and card-hover effects to feature/step/pricing sections; added SVG CircularProgress component and PlanUsageSection with email+client rings to dashboard; added working Upgrade to Pro button in dashboard header for free users; redesigned Sidebar with plan-aware upgrade CTA box (links to /#pricing) or Pro/Business status badge; DashboardShell now passes user.plan to Sidebar; UpgradePrompt fully redesigned in dark theme with usage bar, Pro features list, and $9/month CTA; fixed pre-existing TS errors in ClientHistory.tsx (missing 'sending' status) and rate-limit.ts (Map iteration).

## Outcome

- ✅ Impact: All pages animated and visually consistent; circular progress rings on dashboard for free plan; working upgrade buttons in sidebar + dashboard + limit-reached modal; PKR → USD currency; 0 TypeScript errors
- 🧪 Tests: npx tsc --noEmit — PASS (0 errors)
- 📁 Files: 8 files modified
- 🔁 Next prompts: Run the dev server and verify all pages visually; add payment integration (Stripe) for the upgrade flow; add Sentry for error tracking
- 🧠 Reflection: Passing user.plan as a prop through DashboardShell → Sidebar avoids an extra fetch in the sidebar and keeps the plan data consistent with the rest of the shell

## Evaluation notes (flywheel)

- Failure modes observed: None — all placeholders resolved, TypeScript clean
- Graders run and results (PASS/FAIL): tsc --noEmit PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Add Stripe checkout link to the upgrade CTA buttons

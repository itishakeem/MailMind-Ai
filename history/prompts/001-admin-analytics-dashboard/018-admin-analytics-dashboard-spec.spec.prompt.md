---
id: "018"
title: Admin Analytics Dashboard Spec
stage: spec
date: 2026-06-28
surface: agent
model: claude-sonnet-4-6
feature: 001-admin-analytics-dashboard
branch: 001-admin-analytics-dashboard
user: Abdul Hakeem
command: /sp.specify Admin developer dashboard showing app analytics
labels: ["spec","admin","analytics","dashboard","devtools"]
links:
  spec: specs/001-admin-analytics-dashboard/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-admin-analytics-dashboard/spec.md
  - specs/001-admin-analytics-dashboard/checklists/requirements.md
tests:
  - manual: checklist at specs/001-admin-analytics-dashboard/checklists/requirements.md — all items pass
---

## Prompt

now i want you to build admin dashboard that developer can see analytics of app

(Routed via /sp.specify: "Admin developer dashboard showing app analytics: user growth, email send stats, agent usage, plan distribution, errors, cron health")

## Response snapshot

Created feature branch `001-admin-analytics-dashboard` and wrote a complete spec covering:

- **6 user stories** (P1–P4): KPI cards, user growth + plan distribution, email send stats, agent usage, cron health, Gmail connection rate
- **12 functional requirements** (FR-001–FR-012): admin secret auth, no PII exposure, single API endpoint, per-panel error isolation, `/admin` route
- **6 success criteria** (SC-001–SC-006): load time, security, data accuracy, fault isolation, mobile layout, PII guarantee
- **Key entities**: AdminStats, CronWindow, DailyBucket
- **Assumptions**: ADMIN_SECRET env var, cron health derived from emails table (no new table needed), agent_message_logs graceful degradation

All checklist items pass. Spec ready for `/sp.plan`.

## Outcome

- ✅ Impact: Complete spec for a developer-only analytics dashboard covering all 6 requested analytics dimensions
- 🧪 Tests: Spec quality checklist — all 12 items pass
- 📁 Files: specs/001-admin-analytics-dashboard/spec.md, checklists/requirements.md
- 🔁 Next prompts: `/sp.plan` to design the API + UI architecture; `/sp.tasks` to generate implementation tasks
- 🧠 Reflection: Cron health derived from existing `emails` table avoids schema migration. Admin secret via env var is simpler than full session auth for a developer tool.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): spec quality checklist — all PASS
- Prompt variant (if applicable): n/a
- Next experiment: consider adding a `/sp.clarify` pass if the plan reveals ambiguity around chart library choice

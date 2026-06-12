---
id: "001"
title: MailMind AI Constitution Creation
stage: constitution
date: 2026-06-12
surface: agent
model: claude-sonnet-4-6
feature: none
branch: master
user: Abdul Hakeem
command: /sp.constitution
labels: ["constitution","mailmind-ai","security","ai","saas","gmail","oauth"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
  - history/prompts/constitution/001-mailmind-ai-constitution-creation.constitution.prompt.md
tests:
  - n/a
---

## Prompt

read the project file and write its constitution. MailMind-AI-English.md

## Response snapshot

Read `MailMind-AI-English.md` (448 lines) describing MailMind AI — an AI-powered email
automation SaaS targeting South Asian freelancers and small businesses. Derived six core
principles from the project documentation and produced a complete constitution at
`.specify/memory/constitution.md` (v1.0.0), replacing all template placeholders.

Constitution includes:
- I. Security & Privacy First (OAuth minimal scope, encrypted tokens, JWT)
- II. AI-Augmented, Human-Confirmed (no autonomous sending, preview required)
- III. Simplicity-Driven UX (one task one click, ≤300ms load target, premium aesthetic)
- IV. Graceful Degradation & Resilience (Gemini Flash → Nemotron fallback, manual compose fallback)
- V. Cost-Conscious Scalability (free tier first, unit cost documentation required)
- VI. Data Ownership & Auditability (full audit trail, GDPR readiness, no training data use)
- Technology Constraints (fixed stack table)
- Development Workflow (4-phase launch strategy)
- Governance (amendment procedure, version policy, compliance review cadence)

## Outcome

- ✅ Impact: Full project constitution created from MailMind-AI-English.md; all template placeholders replaced; v1.0.0 ratified 2026-06-12.
- 🧪 Tests: n/a — constitution document, no executable tests
- 📁 Files: .specify/memory/constitution.md (created/overwritten)
- 🔁 Next prompts: /sp.specify to write a feature spec; /sp.adr if any principle warrants an ADR discussion; /sp.plan for architecture planning
- 🧠 Reflection: Six principles cleanly derived from the project file without ambiguity. Technology stack section makes the fixed choices explicit, reducing future ADR overhead for stack decisions already settled.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): add a seventh principle for Accessibility/i18n if South Asian language support becomes a roadmap item

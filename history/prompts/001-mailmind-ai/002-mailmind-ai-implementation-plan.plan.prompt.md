---
id: "002"
title: MailMind AI Implementation Plan
stage: plan
date: 2026-06-12
surface: agent
model: claude-sonnet-4-6
feature: 001-mailmind-ai
branch: 001-mailmind-ai
user: Abdul Hakeem
command: /sp.plan
labels: ["plan","mailmind-ai","next.js","supabase","gmail-api","ai-pipeline","scheduling","openrouter"]
links:
  spec: specs/001-mailmind-ai/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-mailmind-ai/plan.md
  - specs/001-mailmind-ai/research.md
  - specs/001-mailmind-ai/data-model.md
  - specs/001-mailmind-ai/quickstart.md
  - specs/001-mailmind-ai/contracts/auth.yaml
  - specs/001-mailmind-ai/contracts/gmail.yaml
  - specs/001-mailmind-ai/contracts/clients.yaml
  - specs/001-mailmind-ai/contracts/emails.yaml
  - specs/001-mailmind-ai/contracts/ai.yaml
  - specs/001-mailmind-ai/contracts/dashboard.yaml
tests:
  - n/a
---

## Prompt

/sp.plan now read c:\New-app\MailMind-Ai\specs\001-mailmind-ai\spec.md and write plans

## Response snapshot

Executed the full sp.plan workflow for MailMind AI (branch: 001-mailmind-ai).

**Technical Context resolved:**
- TypeScript 5 / Node.js 20, Next.js 14 App Router (unified fullstack)
- Supabase PostgreSQL + RLS for multi-tenant isolation
- Gmail API (send-only OAuth scope), OpenRouter (Gemini Flash) + NVIDIA NIM (Nemotron 3 fallback)
- Vercel Cron Jobs for scheduled delivery, pdf-parse for PDF extraction

**Constitution Check:** All 6 principles passed (no violations).

**Phase 0 — Research (research.md):** 10 decisions documented covering Gmail OAuth scope
(send-only PKCE), Supabase RLS policy pattern, OpenRouter integration, NVIDIA NIM fallback,
Vercel Cron security, pdf-parse limitations, Supabase SSR auth, plan limit enforcement pattern,
AES-256-GCM token encryption, and AI prompt strategy with JSON-structured output.

**Phase 1 — Design artifacts:**
- **data-model.md**: 4 tables (users, clients, emails, documents) with full SQL DDL, RLS policies,
  indexes, validation rules, TypeScript interfaces, state machine for email status transitions,
  and PLAN_LIMITS constant.
- **contracts/**: 5 OpenAPI 3.0 YAML files covering auth, gmail, clients, emails/scheduling/cron,
  ai generation, and dashboard endpoints (20 total API routes).
- **quickstart.md**: 17-step end-to-end validation guide covering all 5 user stories with SQL
  verification steps and a final validation checklist.

**Agent context update:** CLAUDE.md updated with tech stack details via update-agent-context.ps1.

## Outcome

- ✅ Impact: Complete implementation plan with all Phase 0 and Phase 1 artifacts; ready for /sp.tasks.
- 🧪 Tests: n/a — planning documents, no executable tests
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, 5 contract YAML files (10 files total)
- 🔁 Next prompts: `/sp.tasks` to generate implementation tasks; `/sp.adr mailmind-tech-stack`
  to document the key architecture decisions
- 🧠 Reflection: The two-OAuth distinction (Supabase login OAuth vs Gmail send OAuth) is the
  most critical implementation subtlety — both flows are needed but have different scopes,
  storage, and lifecycle. This is clearly documented in research.md section 7.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): split the cron job into a separate Supabase Edge
  Function if Vercel Hobby plan cron limitations become a constraint during beta

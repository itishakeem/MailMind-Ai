---
id: "007"
title: Phase 4 AI Email Send Schedule
stage: green
date: 2026-06-12
surface: agent
model: claude-sonnet-4-6
feature: 001-mailmind-ai
branch: 001-mailmind-ai
user: Abdul Hakeem
command: /sp.implement
labels: ["green","phase-4","ai","pdf","openrouter","nvidia","gmail-send","scheduling","cron","compose-wizard"]
links:
  spec: specs/001-mailmind-ai/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - lib/pdf/extract.ts
  - lib/ai/prompts.ts
  - lib/ai/generate.ts
  - lib/supabase/admin.ts
  - app/api/documents/upload/route.ts
  - app/api/ai/detect-type/route.ts
  - app/api/ai/generate/route.ts
  - app/api/emails/send/route.ts
  - app/api/emails/schedule/route.ts
  - app/api/emails/scheduled/route.ts
  - app/api/emails/[id]/reschedule/route.ts
  - app/api/emails/[id]/cancel/route.ts
  - app/api/emails/[id]/retry/route.ts
  - app/api/cron/send-scheduled/route.ts
  - components/compose/PDFUpload.tsx
  - components/compose/ToneSelector.tsx
  - components/compose/TypeBadge.tsx
  - components/compose/AIPreview.tsx
  - components/compose/ComposeWizard.tsx
  - app/(dashboard)/compose/page.tsx
  - app/(dashboard)/scheduled/page.tsx
  - specs/001-mailmind-ai/tasks.md
tests:
  - npx tsc --noEmit (PASS — 0 errors, clean first run)
---

## Prompt

/sp.implement execute phase 4 from tasks.md

## Response snapshot

Executed all 20 Phase 4 tasks (T039–T058) for US3+US4.

**AI infrastructure** (lib/):
- lib/pdf/extract.ts — pdf-parse wrapper; PdfExtractionError for image-only/corrupt/oversized PDFs
- lib/ai/prompts.ts — buildDetectTypePrompt, buildGenerateEmailPrompt, buildMonthlySummaryPrompt
- lib/ai/generate.ts — two-tier fallback (OpenRouter Gemini Flash → NVIDIA Nemotron 3 Super);
  JSON response parsing with markdown fence stripping; Zod validation; AIUnavailableError;
  401/403 from primary = don't fall back (config error); 5xx/429 = try Nemotron
- lib/supabase/admin.ts — service-role client for cron job (bypasses RLS)

**API routes**:
- /api/documents/upload — multipart PDF, 10MB limit, inserts text-only into documents table
- /api/ai/detect-type, /api/ai/generate — wrappers around lib/ai/generate; return fallback_mode on 503
- /api/emails/send — plan limit check, client snapshot, sendGmail(), insert with status=sent
- /api/emails/schedule — future validation (≥1 min), plan limit check, insert status=scheduled
- /api/emails/scheduled — GET scheduled+failed emails ordered by scheduled_at
- /api/emails/[id]/reschedule, cancel, retry — per-email CRUD
- /api/cron/send-scheduled — CRON_SECRET auth, service-role client, batch processes all due
  emails with Promise.allSettled(), updates status on success/failure; batched to 50/run

**UI**:
- PDFUpload — drag-drop + file picker, progress bar, fallback to text on error
- ToneSelector — 3-button toggle (Friendly/Formal/Strict), Formal default
- TypeBadge — colored badge + dropdown override for type correction (FR-019)
- AIPreview — editable subject+body, Regenerate, Send Now, Schedule with datetime picker,
  fallback banner when AI unavailable
- ComposeWizard — 3-step flow (Client+Input → Tone → Preview+Send), all state managed,
  calls detect-type + generate in sequence, re-generates on type/tone change
- compose/page.tsx — Suspense wrapper for useSearchParams, success screen after send/schedule
- scheduled/page.tsx — table with inline reschedule datetime picker, Retry for failed rows

All T039–T058 marked [x] in tasks.md. tsc --noEmit PASS (0 errors, first run clean).

## Outcome

- ✅ Impact: Core product fully functional — AI email generation, immediate send from Gmail,
  scheduling with cron delivery, fallback to manual compose when AI unavailable.
- 🧪 Tests: npx tsc --noEmit → PASS (0 errors)
- 📁 Files: 22 files created, 1 updated (tasks.md)
- 🔁 Next prompts: `/sp.implement execute phase 5` to add dashboard stats, AI monthly summary, polish
- 🧠 Reflection: The ComposeWizard wraps detect-type + generate as a sequential pair in step 2,
  auto-progressing to step 3 after both complete. Type-change in step 3 triggers regeneration
  inline (handleTypeChange calls runGenerate directly). This pattern keeps UX responsive without
  redundant API calls.

## Evaluation notes (flywheel)

- Failure modes observed: none — tsc clean on first run
- Graders run and results (PASS/FAIL): tsc --noEmit → PASS
- Prompt variant (if applicable): n/a
- Next experiment: add request deduplication in ComposeWizard (debounce regenerate calls)
  to prevent double-fires when user rapidly switches tone

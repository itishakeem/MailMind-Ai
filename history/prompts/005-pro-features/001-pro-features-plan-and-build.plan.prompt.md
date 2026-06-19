---
id: "001"
title: Pro Features Plan and Build
stage: plan
date: 2026-06-19
surface: agent
model: claude-sonnet-4-6
feature: 005-pro-features
branch: 005-pro-features
user: Abdul Hakeem
command: "first built pro suggestions. update specs, plans and task the built"
labels: ["pro-features", "templates", "tones", "notes", "csv-export", "signature", "ai-model", "plan", "implementation"]
links:
  spec: specs/005-pro-features/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/005-pro-features/plan.md
  - specs/005-pro-features/research.md
  - specs/005-pro-features/data-model.md
  - specs/005-pro-features/quickstart.md
  - specs/005-pro-features/tasks.md
  - specs/005-pro-features/contracts/email-templates.yml
  - specs/005-pro-features/contracts/client-notes.yml
  - specs/005-pro-features/contracts/csv-export.yml
  - backend/supabase/migrations/010_pro_features.sql
  - frontend/types/index.ts
  - frontend/lib/csv.ts
  - frontend/lib/ai/prompts.ts
  - frontend/lib/ai/generate.ts
  - frontend/lib/gmail/send.ts
  - frontend/.env.example
  - frontend/app/api/templates/route.ts
  - frontend/app/api/templates/[id]/route.ts
  - frontend/app/api/clients/[id]/notes/route.ts
  - frontend/app/api/clients/[id]/notes/[noteId]/route.ts
  - frontend/app/api/export/emails/route.ts
  - frontend/app/api/export/clients/route.ts
  - frontend/app/api/ai/generate/route.ts
  - frontend/app/api/profile/route.ts
  - frontend/components/compose/ToneSelector.tsx
  - frontend/components/compose/TemplatePicker.tsx
  - frontend/components/compose/ComposeWizard.tsx
  - frontend/components/clients/ClientNotes.tsx
  - frontend/app/(dashboard)/clients/[id]/page.tsx
  - frontend/app/(dashboard)/clients/page.tsx
  - frontend/app/(dashboard)/dashboard/page.tsx
  - frontend/app/(dashboard)/profile/page.tsx
tests:
  - TypeScript type check passed (exit code 0, no output)
---

## Prompt

first built pro suggestions. update specs, plans and task the built

## Response snapshot

Completed the full SDD workflow and implementation for the Pro Features Pack (feature 005):

**Planning artifacts:**
- `research.md`: Resolved all unknowns — Pro AI model (`google/gemini-2.5-pro`), CSV via inline helper (no dep), plan gating via existing 403 pattern, signature column already exists
- `data-model.md`: Defined `email_templates` and `client_notes` tables with RLS; extended `Tone` union; added `EmailTemplate` + `ClientNote` interfaces
- `contracts/`: OpenAPI YAML for templates, client notes, and CSV export
- `quickstart.md`: Developer setup guide with file map and env vars
- `plan.md`: Filled with all technical context, constitution check (all 6 principles pass), phases A/B/C
- `tasks.md`: Full task list — all 17 implementation tasks completed

**Migration:** `010_pro_features.sql` — creates `email_templates` and `client_notes` with RLS policies

**Foundation (Phase A):**
- Extended `Tone` type with `urgent | apologetic | persuasive`
- Added `EmailTemplate` and `ClientNote` interfaces to `types/index.ts`
- Added 3 new tone descriptions to `lib/ai/prompts.ts`
- Added `callWithPro()` to `lib/ai/generate.ts` — silently falls back to standard model if Pro model unset or fails
- Created `lib/csv.ts` — RFC 4180 serialiser with UTF-8 BOM

**API Routes (Phase B):**
- `GET + POST /api/templates` — list and create (with 50-cap enforcement)
- `DELETE /api/templates/[id]`
- Updated `POST /api/ai/generate` — gates Pro tones for Free users (403), routes Pro users to `callWithPro`
- `GET + POST /api/clients/[id]/notes`
- `DELETE /api/clients/[id]/notes/[noteId]`
- `GET /api/export/emails` — CSV with BOM, RFC 4180
- `GET /api/export/clients` — CSV with BOM, RFC 4180
- Updated `GET /api/profile` to return `email_signature`
- Updated `PATCH /api/profile` to save `email_signature` (Pro-gated, 403 for Free)
- Patched `lib/gmail/send.ts` — appends `email_signature` server-side for Pro users before Gmail API call

**UI (Phase C):**
- `ToneSelector`: 6-tone grid, Pro tones show ⚡ lock icon and are disabled for Free users with upgrade link
- `TemplatePicker`: Collapsible panel with template list (select/delete), save-current flow, 50-cap error
- `ComposeWizard`: Fetches user plan on mount; passes `isPro` to ToneSelector; shows TemplatePicker in Step 3 for Pro users
- `ClientNotes`: Add/list/delete notes component; shows upgrade prompt for Free users
- Client detail page: `Private Notes` section added above email history
- Dashboard: `Export CSV` button (Pro users only, links to `/api/export/emails`)
- Clients page: `Export CSV` button (Pro users only, links to `/api/export/clients`)
- Profile page: `Email Signature` card — editable textarea for Pro, upgrade prompt for Free

## Outcome

- ✅ Impact: All 6 Pro features fully implemented — templates, advanced tones, client notes, CSV export, email signature, and priority AI model
- 🧪 Tests: TypeScript type check passed (exit code 0, no output)
- 📁 Files: 32 files created or modified
- 🔁 Next prompts: User needs to run `010_pro_features.sql` migration in Supabase and add `OPENROUTER_PRO_MODEL=google/gemini-2.5-pro` to env vars
- 🧠 Reflection: Server-side signature append in `lib/gmail/send.ts` is the correct placement — ensures signature can never be stripped by UI or network errors

## Evaluation notes (flywheel)

- Failure modes observed: Duplicate `style` prop introduced on profile page (caught and fixed immediately)
- Graders run and results (PASS/FAIL): tsc --noEmit → PASS (exit code 0, no output)
- Prompt variant (if applicable): n/a
- Next experiment: Add a template variable system (e.g. `{{client_name}}`) as a future Pro+ feature

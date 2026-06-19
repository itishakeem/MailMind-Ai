# Implementation Plan: Pro Features Pack

**Branch**: `005-pro-features` | **Date**: 2026-06-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-pro-features/spec.md`

---

## Summary

Add six Pro-exclusive features to MailMind AI: Email Templates, Email Signature Editor, Advanced Tones (Urgent/Apologetic/Persuasive), Client Notes, CSV Export, and Priority AI Model routing. All features are gated by `user.plan === "pro"` at the API layer. Two new Supabase tables are required (`email_templates`, `client_notes`); the signature column already exists.

---

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20 (Next.js 14 App Router)
**Primary Dependencies**: Next.js 14, Supabase JS v2, OpenAI SDK (OpenRouter proxy), Tailwind CSS
**Storage**: Supabase PostgreSQL — two new tables: `email_templates`, `client_notes`
**Testing**: TypeScript `tsc --noEmit` (type check); manual end-to-end testing in browser
**Target Platform**: Vercel (server-side Next.js API routes + React Server/Client Components)
**Project Type**: Web application (frontend/ + backend/ structure)
**Performance Goals**: CSV export ≤5s for 500 rows; template load ≤500ms; notes CRUD ≤300ms
**Constraints**: All Pro feature checks at API layer (not UI only); no new npm dependencies for CSV; env var `OPENROUTER_PRO_MODEL` must have a silent fallback
**Scale/Scope**: ~100–500 active Pro users at launch; each user may have ≤50 templates, ≤N notes per client

---

## Constitution Check

### I. Security & Privacy First ✅
- All new API routes use Supabase `createClient()` (cookie-based session) — no credentials exposed.
- RLS on both new tables ensures users only access their own data.
- Plan enforcement is server-side; UI gates are supplementary.
- No new OAuth scopes needed.

### II. AI-Augmented, Human-Confirmed ✅
- Priority AI model is a quality upgrade, not a behaviour change. Users still review and confirm before send.
- Tone selection remains user-controlled; new tones extend choice, not override.

### III. Simplicity-Driven UX ✅
- Each Pro feature adds one clearly labelled entry point (template picker button, notes "Add Note" button, export button).
- Free users see upgrade prompts, not errors or blank screens.
- Skeleton/loading states required for template picker and notes list.

### IV. Graceful Degradation & Resilience ✅
- Pro model fall-back: if `OPENROUTER_PRO_MODEL` is unset or the model fails, system silently routes to standard model.
- CSV export streams directly from DB query — no in-memory accumulation for large sets.
- Client notes and templates use independent routes; a failure in one does not affect email sending.

### V. Cost-Conscious Scalability ✅
- No new paid services introduced. `google/gemini-2.5-pro` is the only potential cost increase, and it applies only to Pro users (paying $9/mo).
- CSV helper is zero-dependency (no extra npm packages).
- `email_templates` capped at 50/user; `client_notes` have no per-client cap but body ≤2,000 chars.

### VI. Data Ownership & Auditability ✅
- CSV Export directly implements GDPR data-export right.
- Templates and notes are preserved (not deleted) on plan downgrade — SC-007 compliance.
- No user data sent to new third parties.

---

## Project Structure

### Documentation (this feature)

```text
specs/005-pro-features/
├── plan.md              ← this file
├── research.md          ← Phase 0: resolved unknowns
├── data-model.md        ← Phase 1: table schemas + TypeScript types
├── quickstart.md        ← Phase 1: developer setup
├── contracts/
│   ├── email-templates.yml
│   ├── client-notes.yml
│   └── csv-export.yml
└── tasks.md             ← Phase 2 output (/sp.tasks — not yet created)
```

### Source Code

```text
backend/
└── supabase/migrations/
    └── 010_pro_features.sql          ← NEW: email_templates + client_notes tables

frontend/
├── types/index.ts                    ← Extend Tone union; add EmailTemplate + ClientNote
├── lib/
│   ├── ai/
│   │   ├── generate.ts               ← Add Pro model routing
│   │   └── prompts.ts                ← Add 3 tone descriptions
│   ├── gmail/
│   │   └── send.ts                   ← Append email_signature before send
│   └── csv.ts                        ← NEW: RFC 4180 serialiser helper
├── app/api/
│   ├── templates/
│   │   ├── route.ts                  ← NEW: GET + POST
│   │   └── [id]/route.ts             ← NEW: DELETE
│   ├── clients/[id]/
│   │   └── notes/
│   │       ├── route.ts              ← NEW: GET + POST
│   │       └── [noteId]/route.ts     ← NEW: DELETE
│   └── export/
│       ├── emails/route.ts           ← NEW: CSV download
│       └── clients/route.ts          ← NEW: CSV download
├── components/
│   ├── compose/
│   │   └── TemplatePicker.tsx        ← NEW: modal for selecting/saving templates
│   └── clients/
│       └── ClientNotes.tsx           ← NEW: notes list + add/delete UI
└── app/(dashboard)/
    ├── profile/page.tsx              ← Add signature editor (Pro-gated)
    └── clients/[id]/page.tsx         ← Add ClientNotes section
```

**Structure Decision**: Web application (Option 2) — existing `frontend/` + `backend/` layout. All new API routes go under `frontend/app/api/`. Migration SQL goes in `backend/supabase/migrations/`.

---

## Implementation Phases

### Phase A — Foundation (no UI yet)
1. Write migration `010_pro_features.sql` and confirm schema
2. Add `EmailTemplate` and `ClientNote` to `types/index.ts`; extend `Tone` union
3. Add 3 tone descriptions to `lib/ai/prompts.ts`
4. Add `OPENROUTER_PRO_MODEL` env var to `.env.example`
5. Add Pro model routing to `lib/ai/generate.ts`
6. Write `lib/csv.ts` helper

### Phase B — API Routes
7. `GET + POST /api/templates` (list + create)
8. `DELETE /api/templates/[id]`
9. `GET + POST /api/clients/[id]/notes`
10. `DELETE /api/clients/[id]/notes/[noteId]`
11. `GET /api/export/emails`
12. `GET /api/export/clients`
13. Patch `lib/gmail/send.ts` to append signature

### Phase C — UI
14. `TemplatePicker` component + wire into Compose page
15. Signature editor on Profile page (Pro-gated)
16. Tone selector extended with 3 new options (Free users see locked state)
17. `ClientNotes` component + wire into Client detail page
18. Export buttons on Dashboard and Clients pages (Free users see upgrade prompt)

---

## Complexity Tracking

No constitution violations. No complexity justification required.

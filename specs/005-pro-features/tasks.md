# Tasks: Pro Features Pack

**Branch**: `005-pro-features` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Generated**: 2026-06-19

---

## Status Legend
- [x] Complete
- [ ] Not started

---

## Phase A — Foundation

- [x] **A1** — Write migration `010_pro_features.sql` (email_templates + client_notes tables with RLS)
- [x] **A2** — Extend `Tone` union in `types/index.ts` (add urgent, apologetic, persuasive)
- [x] **A3** — Add `EmailTemplate` and `ClientNote` interfaces to `types/index.ts`
- [x] **A4** — Add 3 new tone descriptions to `lib/ai/prompts.ts`
- [x] **A5** — Add `OPENROUTER_PRO_MODEL` to `.env.example`
- [x] **A6** — Add `callWithPro()` function to `lib/ai/generate.ts`; extend `GenerateEmailParams` with `isPro`
- [x] **A7** — Write `lib/csv.ts` RFC 4180 helper

---

## Phase B — API Routes

- [x] **B1** — `GET /api/templates` — list Pro user templates
- [x] **B2** — `POST /api/templates` — create template (with 50-cap check)
- [x] **B3** — `DELETE /api/templates/[id]` — delete template
- [x] **B4** — Update `POST /api/ai/generate` to gate Pro tones + route Pro users to premium model
- [x] **B5** — `GET /api/clients/[id]/notes` — list notes for client
- [x] **B6** — `POST /api/clients/[id]/notes` — create note
- [x] **B7** — `DELETE /api/clients/[id]/notes/[noteId]` — delete note
- [x] **B8** — `GET /api/export/emails` — CSV download (email history)
- [x] **B9** — `GET /api/export/clients` — CSV download (client list)
- [x] **B10** — Patch `GET /api/profile` to return `email_signature`
- [x] **B11** — Patch `PATCH /api/profile` to accept and save `email_signature` (Pro-gated)
- [x] **B12** — Patch `lib/gmail/send.ts` to append `email_signature` for Pro users before send

---

## Phase C — UI

- [x] **C1** — Update `ToneSelector` to show all 6 tones; lock Pro tones for Free users with ⚡ icon
- [x] **C2** — Create `TemplatePicker` component (list, select, save, delete templates)
- [x] **C3** — Update `ComposeWizard` to fetch user plan, pass `isPro` to ToneSelector, show TemplatePicker in Step 3
- [x] **C4** — Create `ClientNotes` component (list, add, delete; upgrade prompt for Free)
- [x] **C5** — Add `ClientNotes` to Client detail page (`/clients/[id]`)
- [x] **C6** — Add Email Signature editor to Profile page (Pro-gated with upgrade prompt for Free)
- [x] **C7** — Add "Export CSV" button to Dashboard page header (Pro only)
- [x] **C8** — Add "Export CSV" button to Clients page header (Pro only)
- [x] **C9** — Add ProBadge visible for Pro users on dashboard ← (already done in payments sprint)

---

## User Action Required

- [ ] **U1** — Run migration `010_pro_features.sql` in Supabase Dashboard → SQL Editor
- [ ] **U2** — Add `OPENROUTER_PRO_MODEL=google/gemini-2.5-pro` to `.env.local` and Vercel environment variables

---

## Acceptance Checks

| Test | Expected |
|------|----------|
| Free user opens Compose → Tone selector | 3 active tones + 3 locked with ⚡ icon |
| Free user generates email → model_used | `gemini-flash` |
| Pro user generates email with Urgent tone | Success; output reflects deadline-focused language |
| Pro user generates email → model_used | `gemini-pro` (or fallback if Pro model unset) |
| Pro user saves a template | Appears in TemplatePicker list immediately |
| Pro user loads a template in Compose | Subject + body pre-filled, editable |
| Pro user saves email signature | Signature appended on next send |
| Free user tries POST /api/templates | `403 { "error": "Pro plan required", "upgrade_required": true }` |
| Pro user exports emails | CSV downloads with correct headers and UTF-8 BOM |
| Pro user adds note to client | Note appears in reverse-chronological list |
| Template count reaches 50 | POST /api/templates returns 400 "limit reached" |
| Note body > 2000 chars | POST /api/clients/:id/notes returns 400 |

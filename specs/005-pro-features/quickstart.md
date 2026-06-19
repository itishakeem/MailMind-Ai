# Developer Quickstart: Pro Features Pack

**Branch**: `005-pro-features` | **Date**: 2026-06-19

---

## Prerequisites

- Local dev environment running (`cd frontend && npm run dev`)
- Supabase local or cloud project connected
- `.env.local` populated (copy from `.env.example`)

---

## 1. Run the Migration

Apply `backend/supabase/migrations/010_pro_features.sql` to your Supabase project:

```bash
# Via Supabase CLI (if using local dev)
supabase db push

# Or paste the SQL directly in Supabase Dashboard → SQL Editor
```

This creates `email_templates` and `client_notes` tables with RLS policies.

---

## 2. Add the New Env Var

```bash
# .env.local
OPENROUTER_PRO_MODEL=google/gemini-2.5-pro
```

If this var is missing, the system falls back silently to the standard Gemini Flash model. No error is thrown.

---

## 3. Test Plan Gating Locally

To test Pro features as a Free user, set `plan = 'free'` in Supabase for your test user, then try accessing `/api/templates`. You should receive `{ "error": "Pro plan required", "upgrade_required": true }` with status 403.

To test as a Pro user, update `plan = 'pro'` in Supabase directly.

---

## 4. Feature Entry Points

| Feature | API routes | UI location |
|---------|-----------|-------------|
| Email Templates | `GET/POST /api/templates`, `DELETE /api/templates/[id]` | Compose page — template picker |
| Email Signature | `PUT /api/profile` (existing, no new route) | Profile page — signature section |
| Advanced Tones | `POST /api/ai/generate` (model upgrade) | Compose page — tone selector |
| Client Notes | `GET/POST /api/clients/[id]/notes`, `DELETE /api/clients/[id]/notes/[noteId]` | Client detail page |
| CSV Export | `GET /api/export/emails`, `GET /api/export/clients` | Dashboard + Clients page |
| Priority AI | `POST /api/ai/generate` (model routing) | Transparent to user |

---

## 5. Key Files to Touch

```
frontend/
├── types/index.ts                           # Add Tone values + EmailTemplate + ClientNote interfaces
├── lib/ai/prompts.ts                        # Add 3 new TONE_DESCRIPTIONS entries
├── lib/ai/generate.ts                       # Add Pro model routing (callWithPro)
├── lib/gmail/send.ts                        # Append email_signature to outgoing body
├── app/api/
│   ├── templates/route.ts                   # NEW — GET + POST
│   ├── templates/[id]/route.ts              # NEW — DELETE
│   ├── clients/[id]/notes/route.ts          # NEW — GET + POST
│   ├── clients/[id]/notes/[noteId]/route.ts # NEW — DELETE
│   ├── export/emails/route.ts               # NEW — CSV download
│   └── export/clients/route.ts             # NEW — CSV download
├── components/
│   ├── compose/TemplatePicker.tsx           # NEW — template picker modal/drawer
│   └── clients/ClientNotes.tsx             # NEW — notes section
└── app/(dashboard)/
    ├── profile/page.tsx                     # Add signature editor (Pro-gated)
    └── clients/[id]/page.tsx               # Add notes section (Pro-gated)
backend/
└── supabase/migrations/010_pro_features.sql # NEW
```

---

## 6. Signature Append Location

In `lib/gmail/send.ts`, after building the email body, add:

```typescript
if (user.email_signature && user.plan !== "free") {
  body = `${body}\n\n${user.email_signature}`;
}
```

This runs server-side so it's always applied regardless of UI state.

---

## 7. CSV Helper

A shared helper lives at `frontend/lib/csv.ts`:

```typescript
export function toCsv(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const line = (cols: string[]) => cols.map(escape).join(",");
  return "﻿" + [line(headers), ...rows.map(line)].join("\r\n");
}
```

The `﻿` BOM ensures Excel on Windows opens the file with correct UTF-8 encoding.

# Research: Pro Features Pack

**Feature**: `005-pro-features` | **Phase**: 0 | **Date**: 2026-06-19

---

## 1. Premium AI Model for Pro Users

**Decision**: Use `google/gemini-2.5-pro` via OpenRouter, configured via `OPENROUTER_PRO_MODEL` env var.

**Rationale**:
- Same provider and API key as the existing Free model (`google/gemini-2.5-flash`) — no new credentials needed.
- Gemini 2.5 Pro outperforms Flash on instruction-following, nuance, and email quality.
- Consistent naming convention: free → flash, pro → pro.
- If the env var is not set, fall back silently to the standard model (FR-020).

**Alternatives considered**:
- `anthropic/claude-haiku-4-5`: Good quality but adds Anthropic billing on top of OpenRouter — cost unclear.
- `openai/gpt-4o-mini`: Familiar but not on the existing provider; extra OpenAI key needed.

**Env var**: `OPENROUTER_PRO_MODEL=google/gemini-2.5-pro` (add to `.env.example`)

**Fallback logic**:
```
Pro user → try OPENROUTER_PRO_MODEL → on failure → fall back to gemini-flash (no error shown)
Free user → gemini-flash → on failure → nemotron fallback (existing behaviour)
```

---

## 2. CSV Generation Approach

**Decision**: Write a minimal RFC 4180 serialiser inline — no third-party library.

**Rationale**:
- RFC 4180 requires only: wrap each field in double-quotes if it contains a comma, double-quote, or newline; escape internal double-quotes by doubling them (`"` → `""`).
- This is ~10 lines of code. Adding `csv-parse` or `fast-csv` is dependency overhead for something this simple.
- Node.js `Buffer.from(csv, "utf-8")` with `Content-Type: text/csv; charset=utf-8` and a BOM prefix (`﻿`) ensures Excel opens it correctly.

**Implementation**:
```typescript
function toCsv(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const line = (cols: string[]) => cols.map(escape).join(",");
  return "﻿" + [line(headers), ...rows.map(line)].join("\r\n");
}
```

---

## 3. Plan Gating for Pro Features

**Decision**: Reuse the existing `plan-limits.ts` pattern — check `user.plan === "pro"` at the API layer and return `403` with a structured `upgrade_required` error to Free users.

**Rationale**:
- The API layer already enforces Free plan limits (emails/month, clients). Same guard pattern for Pro features.
- UI gates (locked tone selectors, hidden template buttons) are presentation-only; real enforcement is always server-side.
- Downgraded users: data stays, API returns 403. No deletion on downgrade.

**Error shape** (consistent with existing `PlanLimitError`):
```json
{ "error": "Pro plan required", "upgrade_required": true }
```

---

## 4. Email Signature Integration

**Decision**: Read `user.email_signature` in the send/schedule routes and append it to the outgoing body before sending via Gmail.

**Rationale**:
- `email_signature` column already exists on `users` table (migration 001).
- No new DB work needed — just plumb it into `lib/gmail/send.ts`.
- Signature is appended server-side so it can never be accidentally stripped by the UI.
- Format: `\n\n${signature}` appended to body string before Gmail API call.

---

## 5. Templates Storage

**Decision**: New `email_templates` table in Supabase.

**Fields**: `id`, `user_id`, `name` (≤100), `subject` (≤200), `body` (≤10,000), `created_at`.
**Cap**: 50 templates per user enforced at `POST /api/templates` with a `COUNT` query before insert.
**RLS**: `user_id = auth.uid()` — users can only see/modify their own templates.

---

## 6. Client Notes Storage

**Decision**: New `client_notes` table in Supabase.

**Fields**: `id`, `client_id`, `user_id`, `body` (≤2,000), `created_at`.
`user_id` is stored redundantly (client already FK → user) to simplify RLS without a join.
**RLS**: `user_id = auth.uid()`.

---

## 7. Advanced Tones Implementation

**Decision**: Extend `Tone` union in `types/index.ts`, extend `TONE_DESCRIPTIONS` in `lib/ai/prompts.ts`, and add UI lock for Free users in the tone selector component.

**New tones**:
- `urgent`: "time-sensitive and deadline-focused, conveying importance without being rude"
- `apologetic`: "sincere and empathetic, acknowledging a mistake or delay with accountability"
- `persuasive`: "benefit-led and motivating, focusing on value and next steps"

**UI gating**: Free users see all 6 tone labels but the last 3 are disabled with a lock icon and tooltip "Pro feature — upgrade to unlock".

---

## Resolved Unknowns Summary

| Unknown | Resolution |
|---------|-----------|
| Pro AI model ID | `google/gemini-2.5-pro` via `OPENROUTER_PRO_MODEL` env var |
| CSV library | Inline 10-line helper, no dependency |
| Plan gating pattern | Extend existing `403 + upgrade_required` pattern |
| Signature storage | `users.email_signature` already exists |
| Template/note tables | New Supabase tables (see data-model.md) |
| Tone additions | 3 new enum values + prompt descriptions |

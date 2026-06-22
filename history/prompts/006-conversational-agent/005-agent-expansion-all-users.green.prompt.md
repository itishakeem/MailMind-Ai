---
id: "005"
title: "Agent Expansion — All Users, Reports, Update Client"
stage: green
date: 2026-06-22
surface: agent
model: claude-sonnet-4-6
feature: "006-conversational-agent"
branch: main
user: Abdul Hakeem
command: general
labels: ["agent", "free-tier", "rate-limiting", "pdf-reports", "update-client", "multilingual", "all-users"]
links:
  spec: specs/006-conversational-agent/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - frontend/types/index.ts
  - frontend/lib/agent/types.ts
  - frontend/lib/agent/tools.ts
  - frontend/lib/agent/handlers.ts
  - frontend/lib/agent/report.ts
  - frontend/app/api/agent/chat/route.ts
  - frontend/components/agent/AgentChatPanel.tsx
  - frontend/components/agent/UpdateClientCard.tsx
  - backend/supabase/migrations/010_agent_message_logs.sql
tests:
  - TypeScript: npx tsc --noEmit — PASS (zero errors)
  - pdf-lib: installed v1.17.1
---

## Prompt

now add conversational ai agent using openai chatkit ui. for both free and pro users. free users only can send 10 message in every 24hrs. pro and business plan users can use unlimited. what agent can do: communicate like human, knows everything about users, can generate and send email as user want, remove, add and update clients, fast response, having memory of current session if new session started forgot previous session, generate reports in pdf or docs file, 24hrs, 7day or monthly reports, use same language as in which user is talking. free users can add 5 clients and send 10 emails in every 24 hrs. use chatkit for agent ui.

## Clarifications resolved

- @openai/chatkit is TypeScript type definitions only (no runtime) — enhanced existing custom React chat UI
- PDF only (no Docs/CSV) for reports
- Free client limit changed globally from 3 → 5

## Response snapshot

**New files:**
- `lib/agent/report.ts` — generatePDFReport() using pdf-lib (A4, indigo header, email + client tables)
- `components/agent/UpdateClientCard.tsx` — shows current→proposed field changes, Yes/Cancel
- `backend/supabase/migrations/010_agent_message_logs.sql` — per-user Supabase rate limit table (10 msgs/24hr)

**Modified files:**
- `types/index.ts` — free max_clients: 3 → 5
- `lib/agent/types.ts` — added PendingUpdateClient, AgentReportResponse
- `lib/agent/tools.ts` — added update_client + generate_report tools; SYSTEM_PROMPT → buildSystemPrompt(ctx) with dynamic user context + multilingual instruction
- `lib/agent/handlers.ts` — added handleUpdateClient(), handleGenerateReport(); handleAddClient() gains phone field
- `app/api/agent/chat/route.ts` — removed plan gate (open to all), Supabase-backed rate limiting for free users (10/24hr), wired all 5 tools, dynamic system prompt with client count context
- `components/agent/AgentChatPanel.tsx` — open to all users, message counter badge for free users, UpdateClientCard, report download card with Blob URL, "Type in any language…" placeholder

**Agent tools (5):** add_client, update_client, remove_client, send_email, generate_report

**TypeScript:** clean (zero errors)

## Outcome

- ✅ Agent open to all users (free + pro + business)
- ✅ Free: 10 messages/24hr enforced via Supabase agent_message_logs table
- ✅ Free: 5 client global limit (was 3)
- ✅ update_client tool: fuzzy match → confirmation card → UPDATE
- ✅ generate_report: PDF with email table + client table for 24h/7d/30d periods
- ✅ Multi-language: system prompt instructs Alex to match user's language
- ✅ Dynamic system prompt with user name, plan, client count
- ⚠️ Run migration 010_agent_message_logs.sql in Supabase before deploying
- ⚠️ pdf-lib added to package.json (server-side only, no client bundle impact)

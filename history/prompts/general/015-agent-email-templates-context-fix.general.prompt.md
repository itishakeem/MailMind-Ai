---
id: "015"
title: Agent Email Templates & Conversation Context
stage: green
date: 2026-06-25
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Abdul Hakeem
command: "fix agent: email type/tone flow, HTML templates, placeholder brackets, MailMind branding, context reuse"
labels: ["agent", "email-templates", "html", "ai-prompt", "conversation-context", "bug"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/lib/email/html-template.ts
  - frontend/lib/gmail/send.ts
  - frontend/lib/agent/tools.ts
  - frontend/lib/ai/prompts.ts
  - frontend/lib/agent/handlers.ts
  - frontend/app/api/agent/chat/route.ts
tests:
  - manual: agent asks for project/amount before drafting invoice or payment_reminder
  - manual: "same as above" reuses type+tone without asking again
  - manual: invoice draft body contains no [bracketed placeholders]
  - manual: received emails have no MailMind AI branding
---

## Prompt

Multiple agent and email quality fixes requested:
1. Emails are plain text with no color/headings — need HTML templates per type (invoice, payment reminder, proposal, etc.)
2. Agent does not ask for email type and tone before drafting
3. Agent does not understand "same as above" / conversation context
4. Received emails show "Sent via MailMind AI" branding
5. Invoice emails contain [Project Name] and [Invoice Number] placeholder brackets
6. Agent 402 credit exhaustion error due to OpenRouter paid key with insufficient credits

## Response snapshot

**1. HTML email templates** — created `frontend/lib/email/html-template.ts`:
- Type-specific color themes: invoice=#1d4ed8, payment_reminder=#b45309, project_update=#047857, proposal=#6d28d9, manual=#374151
- `renderEmailHtml()` converts plain text to full HTML with inline CSS, type badge, table-based layout
- `bodyToHtml()` handles paragraphs, bullet lists, numbered lists, **bold**, _italic_
- No "MailMind AI" brand header or footer — emails appear to come directly from sender

**2. Agent conversation flow** — updated `frontend/lib/agent/tools.ts` `buildSystemPrompt`:
- Added email drafting rules: NEVER call send_email without email_type and tone
- For Invoice/Payment Reminder: ask for project name and amount before drafting
- Context reuse instruction: infer type+tone from conversation history for "same as above", "also send to X", etc.

**3. Placeholder brackets** — updated `frontend/lib/ai/prompts.ts` `buildGenerateEmailPrompt`:
- Added explicit rule: NEVER use [Project Name], [Invoice Number], [Amount], [Date], [Your Name], or any [bracketed text]
- If a detail is unknown, write around it naturally

**4. Email type propagation** — updated `frontend/lib/agent/handlers.ts`:
- `handleSendEmail` now accepts `emailType` in draft object and passes it to `sendGmail`
- `ai_detected_type` and `tone` now stored correctly in DB (were hardcoded "manual"/"friendly")

**5. Agent model fix** — updated `frontend/app/api/agent/chat/route.ts`:
- Agent always uses `OPENROUTER_API_KEY_FREE` — paid key reserved for email generation only
- Primary model: `google/gemini-2.5-flash-preview:free` (pro) / `google/gemini-2.0-flash-exp:free` (free)
- `max_tokens: 1024` to prevent credit exhaustion on any model
- Fallback: `openrouter/auto` if primary model fails

**6. Gmail send** — updated `frontend/lib/gmail/send.ts`:
- Added `emailType` to `SendGmailOptions`, passed to `renderEmailHtml`
- Email sends as multipart/alternative with both text/plain and text/html parts

## Outcome

Verification results (4 flows tested via HTTP against localhost:3000):
- ✅ Flow 1: Agent asks for project/amount when payment_reminder requested
- ✅ Flow 3: Invoice draft — zero [bracketed placeholders], correct type/tone stored
- ✅ Flow 4: "same as above" correctly reuses payment_reminder + urgent tone from context
- ⚠️ Flow 2: Multi-client send calls list_clients first to identify clients (expected multi-step behavior)

## Evaluation notes (flywheel)

- Failure modes observed: (1) AI generated [Project Name] etc — fixed via explicit prompt rule; (2) agent didn't ask for type/tone — fixed via system prompt rules; (3) 402 error — fixed by switching to free key + free models
- Graders run and results (PASS/FAIL): manual HTTP verification — PASS
- Prompt variant: conversation history context reuse rule
- Next experiment: test "send to both clients" full multi-turn flow to verify sequential draft + send per client works end-to-end

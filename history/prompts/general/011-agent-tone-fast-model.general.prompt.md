---
id: "011"
title: "Agent Tone Fix and Fast Free Model"
stage: general
date: 2026-06-23
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Abdul Hakeem
command: general
labels: ["agent", "email-generation", "openrouter", "tone", "performance"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/lib/agent/tools.ts
  - frontend/app/api/agent/chat/route.ts
  - frontend/lib/ai/generate.ts
tests: []
---

## Prompt

agent not generating email when i selected tone. use openrouter auto free model on first openrouter key. make generating process fast.

(follow-up) second key only for conversational agent. while background agent generate email using 1st key using openrouter/free. for now after adding description i am getting: AI is temporarily unavailable — composing manually.

## Response

### Key architecture: two separate keys with different roles
- `OPENROUTER_API_KEY_FREE` (second key): conversational agent chat only (`agent/chat/route.ts`). Free users → `openrouter/auto`; reverted my earlier mistake of combining keys.
- `OPENROUTER_API_KEY` (first key): email generation (`generate.ts`, compose flow). Uses `google/gemini-2.0-flash-exp:free` — explicit free model. `openrouter/auto` on a paid key routes to paid models and fails without credits, which caused the "AI temporarily unavailable" error.

### Fix 1: Tone was hardcoded (`tools.ts` + `route.ts`)
- Added optional `tone` enum to `send_email` tool definition (6 values)
- Agent now extracts `toolArgs.tone ?? "friendly"` and passes it to `generateEmail`
- Imported `Tone` type in route.ts

### Fix 2: Compose "AI temporarily unavailable" error (`generate.ts`)
- Root cause: `callFreeModel` was using `nvidia/nemotron-3-super-120b-a12b:free` (slow/failing), then changed to `openrouter/auto` which also failed because the primary key has no paid credits, so `openrouter/auto` routed to paid models
- Fix: switched to `google/gemini-2.0-flash-exp:free` — explicit free-tier model, fast and available on the primary key

### Fix 3: Agent key routing (`route.ts`)
- Reverted `openRouter()` back to `openRouter(plan)` with dual-key logic
- Free users: `OPENROUTER_API_KEY_FREE` + `openrouter/auto`
- Pro users: `OPENROUTER_API_KEY` + `google/gemini-2.5-flash`

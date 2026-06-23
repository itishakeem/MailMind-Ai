---
id: "008"
title: "Spec Consistency Audit and Update"
stage: general
date: 2026-06-23
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Abdul Hakeem
command: general
labels: ["spec", "documentation", "consistency", "agent", "plans"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - MailMind-AI-English.md
  - MailMind_Agent_Build_Spec.md
tests: []
---

## Prompt

read these both project files make sure specs are consistant according to these file: MailMind-AI-English.md. MailMind_Agent_Build_Spec.md

## Response

Audited both spec files against the actual codebase implementation and updated both to match.

### Inconsistencies found and fixed

1. **Plan name mismatch (critical):** Agent spec used "Agency" everywhere; implementation uses "business". Fixed throughout Agent spec — all references to `agency` replaced with `business`, plan values updated to `free / pro / business`.

2. **Agent tools count:** Agent spec claimed 3 tools; implementation has 6. Updated spec to document all 6: `list_clients`, `add_client`, `update_client`, `remove_client`, `send_email`, `generate_report`.

3. **Agent access model:** Agent spec said Pro-only; implementation gives all plans access (free gets 10 messages/24h rate limit). Updated access table and rate-limiting logic in spec.

4. **Client schema — no `category` field:** Agent spec referenced a `category` field on clients; implementation uses `company` and `phone`. Corrected in spec's tool definitions and schema section.

5. **OpenAI ChatKit removed:** Agent spec was built around `@openai/chatkit-react` which was never implemented. Replaced with documentation of the actual custom React UI: `AgentChatPanel`, `AgentMessage`, `ConfirmActionCard`, `EmailDraftCard`, `UpdateClientCard`.

6. **AI model split:** English.md said "Gemini Flash" with no version and one key; implementation uses `google/gemini-2.5-flash` for pro/business and `openrouter/auto` for free, with two separate API keys. Updated both files.

7. **Agent name:** Spec never named the agent; implementation names it "Alex". Added throughout.

8. **`agent_message_logs` table:** Not in English.md schema. Added.

9. **`gmail_access_token` / `gmail_refresh_token` vs `gmail_token`:** English.md schema listed two separate token fields; implementation uses a single `gmail_token`. Corrected.

10. **Free plan agent feature:** Neither spec listed Alex as a free plan feature. Added to English.md plan comparison.

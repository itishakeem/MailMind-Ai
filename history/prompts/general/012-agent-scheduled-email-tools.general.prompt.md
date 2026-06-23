---
id: "012"
title: "Agent Scheduled Email Management Tools"
stage: general
date: 2026-06-23
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Abdul Hakeem
command: general
labels: ["agent", "scheduled-emails", "tools", "workspace"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/lib/agent/types.ts
  - frontend/lib/agent/tools.ts
  - frontend/lib/agent/handlers.ts
  - frontend/app/api/agent/chat/route.ts
tests: []
---

## Prompt

give the conversational agent access to update remove or add, any thing like, client, scheduled email update time or date. conversational agent can only access workspace of user do not access the personal info. just know about name on dashboard.

## Response

Added 3 new agent tools + updated system prompt. Agent can now manage scheduled emails alongside existing client tools.

### New tools
- `list_scheduled_emails` — lists all pending emails with subject, recipient, scheduled time
- `reschedule_email` — takes identifier (subject/client keywords) + new ISO datetime; shows confirmation before updating
- `cancel_scheduled_email` — takes identifier; shows confirmation before setting status = 'cancelled'

### Updated system prompt
- Added today's date so Alex can convert "tomorrow 3pm" to ISO format
- Explicitly lists all 9 capabilities including scheduled email management
- Added scope boundary: "You only have access to workspace data (clients and emails)"
- Instructs Alex to use ISO 8601 for reschedule tool arg

### Files changed
- `types.ts` — added `PendingRescheduleEmail` and `PendingCancelScheduledEmail` to `PendingAction` union
- `tools.ts` — 3 new tool definitions; updated system prompt with today's date and new capabilities
- `handlers.ts` — `handleRescheduleEmail` and `handleCancelScheduledEmail`
- `route.ts` — imported new handlers; added pending action resolution for both new types; added 3 new tool handler blocks with fuzzy subject/client-name matching

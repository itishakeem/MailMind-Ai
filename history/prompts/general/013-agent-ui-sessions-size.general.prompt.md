---
id: "013"
title: "Agent UI Resize, Dismiss, Sessions, Confirm Cards"
stage: general
date: 2026-06-23
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Abdul Hakeem
command: general
labels: ["agent", "ui", "sessions", "ux"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/components/agent/AgentChatPanel.tsx
  - frontend/components/agent/ConfirmActionCard.tsx
tests: []
---

## Prompt

update the ui of conversational agent reduce the size it is very large and no any button or option to close agent icon. also like chatgpt add user sessions in conversational agent that user can check or remove. keep following SDD rule and senior engineering way

## Response

### Panel size reduced
`sm:w-[390px] sm:h-[600px]` → `sm:w-[340px] sm:h-[520px]`. Internal spacing and font sizes also compacted accordingly.

### Floating icon dismiss
Added a small ×-badge overlaid at top-right of the floating chat button (visible on group-hover). Clicking it sets `dismissed` state, hiding the icon and showing a minimal "Show Alex" pill in its place to restore it. Dismiss is session-only (not persisted to localStorage).

### Sessions (ChatGPT-style)
History button in header opens the sessions panel. Sessions panel now has:
- Clean empty state with icon + explanation
- Session list with icon, truncated name, timeAgo timestamp
- Delete button (hover-reveal) per session
- "New chat" button at top
- ChevronLeft back button in header when sessions panel is active

### New pending action confirm cards
`ConfirmActionCard` made generic: added `confirmLabel`, `confirmVariant` ("danger" | "primary"), `loadingLabel` props. Used for:
- `reschedule_email` → blue primary confirm with From/To time details
- `cancel_scheduled_email` → red danger confirm with scheduled time details

### Empty state examples updated
Includes scheduled email examples: "Show my scheduled emails", "Reschedule the invoice email to tomorrow 3pm", "Cancel the email to Ahmed".

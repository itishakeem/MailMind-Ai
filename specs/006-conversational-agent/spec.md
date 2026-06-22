# Feature Specification: MailMind Conversational Agent

**Feature Branch**: `006-conversational-agent`  
**Created**: 2026-06-22  
**Status**: Draft  
**Input**: MailMind_Agent_Build_Spec.md — Pro-only chat agent with 3 tool-calling actions

---

## Overview

A chat-based conversational agent embedded inside the MailMind dashboard, available exclusively to Pro-tier and Agency-tier users. Users interact with the agent in natural language to perform real actions — adding clients, removing clients, and sending emails — without leaving the dashboard. This is a **tool-calling agent**, not a Q&A chatbot. Destructive and external actions (remove, send) require explicit user confirmation before execution.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Add a Client via Conversation (Priority: P1)

A Pro user wants to add a new client without navigating to the client management screen. They open the agent chat panel, describe the client in plain language, and the agent extracts the structured data and saves the client to their account.

**Why this priority**: Adding clients is the foundation of MailMind's value. This story delivers immediate value without any risk of data loss, making it the safest, most demonstrable MVP action.

**Independent Test**: Can be fully tested by typing "Add Ahmed Khan, ahmed@xyz.com, real estate" into the chat and verifying the client appears in the client list — no other tools needed.

**Acceptance Scenarios**:

1. **Given** a logged-in Pro user with the chat panel open, **When** they type "Add a new client, Ahmed Khan, ahmed@xyz.com, he's in real estate", **Then** the agent confirms the addition with the client's name, email, and category, and the client appears in the client list immediately.
2. **Given** a logged-in Pro user, **When** they add a client with a name and email but no category, **Then** the agent adds the client with a default/unspecified category and confirms the action.
3. **Given** a logged-in Free-tier user who navigates directly to the agent endpoint, **When** they submit a message, **Then** they receive a clear "Pro plan required" rejection — the action is not performed.

---

### User Story 2 — Remove a Client via Conversation (Priority: P2)

A Pro user wants to remove a client they no longer work with. They reference the client by name in the chat. The agent finds the matching record, shows the user who will be removed, and waits for an explicit confirmation before deleting.

**Why this priority**: Removal is irreversible; the mandatory confirmation step is the core safety guarantee. This story directly validates the non-silent-destructive-action rule.

**Independent Test**: Can be fully tested by typing "Remove Sarah from my clients", observing the confirmation card, clicking Yes, and verifying the client no longer appears in the list.

**Acceptance Scenarios**:

1. **Given** a Pro user with a single client named "Sarah Malik", **When** they say "Remove Sarah from my clients", **Then** the agent displays a confirmation card showing Sarah Malik's details and waits for Yes/No — it does NOT delete immediately.
2. **Given** the confirmation card is shown, **When** the user clicks or says "Yes", **Then** the client is deleted and the agent confirms the removal.
3. **Given** the confirmation card is shown, **When** the user clicks or says "No" or "Cancel", **Then** no deletion occurs and the agent acknowledges the cancellation.
4. **Given** a Pro user with two clients both named "Sarah", **When** they say "Remove Sarah", **Then** the agent asks which Sarah (listing both) before showing any confirmation card.
5. **Given** the user references a client name that does not exist, **When** they say "Remove Marcus", **Then** the agent replies that no matching client was found and takes no action.

---

### User Story 3 — Send an Email to a Client via Conversation (Priority: P3)

A Pro user wants to send a contextual email to one of their clients without leaving the dashboard. They describe what the email should say in natural language. The agent drafts the email, shows the full draft to the user, and only sends it after explicit confirmation.

**Why this priority**: Email sending touches an external system (the recipient's inbox) and is irreversible. The confirmation flow is mandatory, making this the most complex story — built after the two lower-risk stories validate the confirmation pattern.

**Independent Test**: Can be fully tested by typing "Email Ahmed about the new listing on Main St", reviewing the draft card, confirming, and verifying the email appears in the user's Gmail Sent folder.

**Acceptance Scenarios**:

1. **Given** a Pro user with Ahmed Khan in their client list, **When** they say "Email Ahmed about the new 3-bedroom listing on Main St, ask if he wants a viewing this week", **Then** the agent generates a draft email and displays it in a card with the subject, body, and recipient — it does NOT send yet.
2. **Given** the draft email card is shown, **When** the user confirms ("Yes" / "Send"), **Then** the email is sent via the user's connected Gmail account and the agent confirms delivery.
3. **Given** the draft email card is shown, **When** the user cancels, **Then** no email is sent and the agent acknowledges the cancellation.
4. **Given** the user references a client name that does not exist in their list, **When** they say "Email Marcus about the proposal", **Then** the agent replies that no matching client was found and prompts the user to add the client first — it does not create a client automatically.
5. **Given** the user's message matches multiple clients, **When** they say "Email Sarah about the update", **Then** the agent asks which Sarah before generating any draft.

---

### User Story 4 — Access Gating for Non-Pro Users (Priority: P1, cross-cutting)

Free-tier users do not see the agent chat panel. If a Free-tier user attempts to access the agent through any means (UI or direct API call), they are rejected with a clear explanation and an upgrade prompt.

**Why this priority**: Plan enforcement is a business requirement and a security invariant — it must hold even if the frontend is bypassed.

**Independent Test**: Can be tested independently by logging in as a Free user and confirming the chat panel is absent from the dashboard, then calling the agent session endpoint directly and confirming a 403 response.

**Acceptance Scenarios**:

1. **Given** a logged-in Free-tier user, **When** they view the dashboard, **Then** the agent chat panel is not visible.
2. **Given** a Free-tier user who calls the agent session endpoint directly (e.g. via developer tools), **When** they submit the request, **Then** the server returns a 403 error — no session is created, no action is performed.
3. **Given** a Pro-tier user, **When** they view the dashboard, **Then** the agent chat panel is visible and accessible.

---

### Edge Cases

- What happens when the agent is called but the user's Gmail account is disconnected? → Agent should detect the missing connection and tell the user to reconnect Gmail before sending emails; client add/remove actions should still work.
- What happens when the user's message is ambiguous and matches no known intent? → Agent responds conversationally, explains what it can do (add/remove clients, send emails), and asks the user to rephrase.
- What happens if the client list is empty and the user tries to remove or email a client? → Agent replies that no clients are found and suggests adding one first.
- What happens if the same client name appears with different capitalizations or minor spelling variations? → The fuzzy match should surface the closest match and ask for confirmation before proceeding.
- What happens if a request involves multiple clients (e.g., "email all my real estate clients")? → Out of scope for v1 — agent informs the user that it currently supports single-client actions only.

---

## Requirements *(mandatory)*

### Functional Requirements

**Agent Access**

- **FR-001**: The agent chat panel MUST only be rendered for users with a Pro or Agency subscription plan.
- **FR-002**: The server MUST verify the user's plan on every agent interaction request — plan enforcement MUST NOT rely on frontend visibility alone.
- **FR-003**: A Free-tier user who accesses the agent endpoint directly MUST receive a plan-gating rejection with a clear message; no agent action may be performed.

**Add Client**

- **FR-004**: Users MUST be able to add a new client by describing the client in natural language (name, email, optional category).
- **FR-005**: The agent MUST extract name and email as required fields; category MUST be treated as optional with a sensible default if omitted.
- **FR-006**: A newly added client MUST be immediately visible in the user's client list after confirmation.
- **FR-007**: The agent MUST associate each added client with the authenticated user's account — a user must never see or modify another user's clients.

**Remove Client**

- **FR-008**: Users MUST be able to reference a client by name or email to initiate removal.
- **FR-009**: Before removing any client, the agent MUST display a confirmation step showing the matched client's details and require explicit user approval.
- **FR-010**: The agent MUST NOT execute the removal until the user confirms in the same interaction; cancellation must leave the client record unchanged.
- **FR-011**: If the user's reference matches more than one client, the agent MUST present all matches and ask the user to specify which one before showing any confirmation.
- **FR-012**: If no matching client is found, the agent MUST inform the user and take no action.

**Send Email**

- **FR-013**: Users MUST be able to instruct the agent to send an email to an existing client using natural language instructions about the email's purpose/content.
- **FR-014**: The agent MUST generate a draft email (subject + body) based on the user's instructions and display the full draft before any send action occurs.
- **FR-015**: The agent MUST require explicit user confirmation before sending the email; cancellation must result in no email being sent.
- **FR-016**: The agent MUST NOT create a new client record if the referenced client does not exist; it MUST inform the user and suggest adding the client first.
- **FR-017**: Email sending MUST use the user's own connected Gmail account — the email must appear as sent from the user, not from a system address.
- **FR-018**: If ambiguous client matching occurs for an email request, the agent MUST resolve the ambiguity before generating any draft.

**Conversation Behavior**

- **FR-019**: The agent MUST respond in short, conversational plain language — responses should be concise and action-confirmations should be clear.
- **FR-020**: If the user's request is outside the three supported actions, the agent MUST respond helpfully and remind the user of its capabilities without crashing or producing an error.
- **FR-021**: The agent MUST maintain enough conversation context within a session to handle multi-turn flows (e.g., "remove Sarah" → agent asks "which Sarah?" → user answers → agent proceeds).

**Scope Constraints**

- **FR-022**: The agent MUST support exactly three actions in v1: add client, remove client, send email. No additional tools or automations may be introduced.
- **FR-023**: Multi-client batch actions (e.g., "email all real estate clients") are NOT supported in v1 — the agent must inform the user and suggest the single-client equivalent.

### Key Entities

- **Client**: A contact record owned by a specific user. Has a unique identifier, owner reference, name, email, optional category/type, and creation timestamp. Clients are strictly user-scoped — a user can only access their own clients.
- **Conversation Session**: A bounded exchange between the user and the agent within a single dashboard visit. Carries enough message history to support multi-turn confirmation flows.
- **Pending Action**: An agent-proposed action (removal or email send) that has been surfaced to the user for confirmation but not yet executed. Canceled if the user declines; executed only on explicit approval.
- **Email Draft**: A generated subject + body produced by the agent from the user's plain-language instructions, displayed to the user for review before any send occurs.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pro users can add a new client through conversation in under 30 seconds from typing the first message to seeing the client appear in their list.
- **SC-002**: Zero client deletions occur without explicit user confirmation — the confirmation step must be present in 100% of remove interactions.
- **SC-003**: Zero emails are sent without explicit user confirmation — the draft review and confirmation step must appear in 100% of email interactions.
- **SC-004**: Free-tier users are blocked from all agent functionality in 100% of cases, regardless of access method (UI or direct endpoint).
- **SC-005**: Ambiguous client references (multiple name matches) are never silently resolved — clarification is requested in 100% of ambiguous cases.
- **SC-006**: The agent correctly handles at least 90% of well-formed natural language requests for the three supported actions without requiring the user to rephrase.
- **SC-007**: The chat panel loads and is interactive within 2 seconds of the dashboard rendering for Pro users.

---

## Assumptions

- Pro and Agency plan users both have access to the agent; Free plan does not.
- The user's Gmail account is already connected (OAuth authorized) as part of the existing email generation feature — the agent reuses this connection.
- Conversation history is session-scoped (current browser session); there is no requirement to persist chat history across sessions in v1.
- Email drafts generated by the agent follow the same quality and tone as the existing MailMind email generation feature — the agent reuses that generation logic rather than implementing a separate prompt.
- Client fuzzy matching is performed against the authenticated user's own client list only — cross-user searches are never performed.
- The agent chat panel is a new, additive UI component and does not replace or alter the existing standalone email generator interface.

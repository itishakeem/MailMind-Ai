# Feature Specification: MailMind AI — Full Product

**Feature Branch**: `001-mailmind-ai`
**Created**: 2026-06-12
**Status**: Draft
**Input**: User description: "read the project file and write its specifications. MailMind-AI-English.md"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Account Creation & Gmail Connection (Priority: P1)

A new user discovers MailMind AI and wants to start sending professional emails to clients.
They create an account (via email/password or Google sign-in), then connect their Gmail
account so the system can send emails on their behalf. Without completing this story, no
other feature is accessible.

**Why this priority**: This is the entry gate to the entire product. Every other user story
depends on a connected Gmail account. An incomplete onboarding means zero value delivered.

**Independent Test**: A fresh user can register, connect Gmail, and see the empty dashboard —
all without any pre-existing data. Verified by signing in from a new incognito session.

**Acceptance Scenarios**:

1. **Given** a visitor on the landing page, **When** they click "Sign Up" and submit valid
   name/email/password, **Then** their account is created and they are redirected to an
   onboarding screen prompting them to connect Gmail.
2. **Given** a visitor, **When** they click "Sign in with Google", **Then** they are
   authenticated via Google OAuth and land on the same Gmail connection prompt.
3. **Given** a logged-in user on the Gmail connection screen, **When** they click
   "Connect Gmail" and approve the Google permission dialog, **Then** their Gmail account
   is linked and they are redirected to the dashboard with a success confirmation.
4. **Given** a user on the Settings page, **When** they click "Disconnect Gmail", **Then**
   their Gmail access is revoked, all scheduled emails are paused, and they see a
   reconnect prompt on the dashboard.
5. **Given** a user whose Gmail OAuth token has expired, **When** they attempt any
   email send or schedule action, **Then** the system silently refreshes the token without
   user intervention; if refresh fails, the user is prompted to reconnect Gmail.

---

### User Story 2 — Client Management (Priority: P2)

An authenticated user needs to maintain a contact book of clients. They add clients
(freelance customer, business contact, etc.) with their details, and can later view the
complete history of emails sent to each client. They can edit or remove clients as needed.

**Why this priority**: Clients are the recipients of every email MailMind AI generates.
Without client records, the compose flow has no destination. This is a shared dependency
for US3 and US4.

**Independent Test**: A logged-in user (Gmail not yet connected) can add three clients,
edit one, delete one, and view the email history (empty) of the remaining one — proving
client management works independently of email sending.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the Clients page, **When** they click "Add Client" and
   submit name and email (required fields), **Then** a new client record is created and
   appears in the client list.
2. **Given** a logged-in user, **When** they open a client's detail view, **Then** they
   see all stored fields (name, email, phone, company, address) and a chronological list
   of all emails sent to that client.
3. **Given** a logged-in user on the Free plan, **When** they already have 3 clients and
   try to add a fourth, **Then** the system blocks the action and shows an upgrade prompt.
4. **Given** a logged-in user, **When** they edit a client's details and save, **Then**
   the updated information is persisted and reflected immediately in all views.
5. **Given** a logged-in user, **When** they delete a client, **Then** the client record
   is removed; existing email history for that client is retained for audit purposes.

---

### User Story 3 — AI Email Generation & Immediate Send (Priority: P3)

An authenticated user with a connected Gmail selects a client, provides context (PDF
upload or free-text description), and the AI generates a professional email. The user
reviews the AI-detected type and email content, optionally adjusts the tone or edits the
text, then sends it immediately from their own Gmail.

**Why this priority**: This is the core value proposition of MailMind AI. It solves the
primary pain point — writing professional client emails — and delivers the main product
promise.

**Independent Test**: A user with Gmail connected and one existing client can compose,
preview, and send an email end-to-end. The email appears in the client's history and in
the user's Gmail Sent folder.

**Acceptance Scenarios**:

1. **Given** a user on the Compose page, **When** they upload a PDF, **Then** the system
   extracts the text and the AI detects the context type (invoice / reminder / update /
   proposal) and displays it to the user.
2. **Given** a user on the Compose page, **When** they type a free-text description,
   **Then** the AI detects the context type and generates a professional subject line and
   email body.
3. **Given** AI has generated an email, **When** the user selects "Formal" tone (vs.
   Friendly or Strict), **Then** the generated email reflects the selected tone in wording
   and phrasing.
4. **Given** an AI-generated email is displayed in preview, **When** the user edits the
   subject and/or body, **Then** the edited version is used for sending (not re-generated).
5. **Given** a user who clicks "Send Now", **When** the email is dispatched, **Then** it
   arrives in the recipient's inbox with the sender being the user's Gmail address (not a
   MailMind AI address).
6. **Given** the AI pipeline is completely unavailable, **When** a user opens Compose,
   **Then** a manual compose form is shown; the user can write the email themselves and
   send it via their Gmail without AI assistance.
7. **Given** a user on the Free plan who has sent 10 emails this month, **When** they
   attempt to send another email, **Then** the action is blocked and an upgrade prompt is
   displayed.

---

### User Story 4 — Email Scheduling (Priority: P4)

An authenticated user with a connected Gmail composes an email (with AI assistance) and
instead of sending immediately, schedules it for a specific future date and time. The
system automatically delivers the email at the scheduled time. The user can view, cancel,
or reschedule pending emails.

**Why this priority**: Scheduling transforms MailMind AI from a manual send tool into an
automated workflow assistant, directly serving the "payment reminder" and "follow-up"
use cases described in the product requirements.

**Independent Test**: A user can schedule an email 2 minutes in the future, wait, and
confirm the email arrives in the recipient's inbox at the scheduled time and appears as
"sent" in the Scheduled Emails page.

**Acceptance Scenarios**:

1. **Given** a user reviewing an AI-generated email preview, **When** they select
   "Schedule" and choose a future date and time, **Then** the email is saved as
   "scheduled" and appears on the Scheduled Emails page.
2. **Given** the scheduled time arrives, **When** the system triggers delivery, **Then**
   the email is sent from the user's Gmail and its status changes to "sent".
3. **Given** a scheduled email fails to send (e.g., Gmail token expired), **When** the
   system detects the failure, **Then** the email status is set to "failed", the user
   receives a notification, and the email remains available for retry.
4. **Given** a user on the Scheduled Emails page, **When** they cancel a pending email,
   **Then** the email is removed from the queue and no longer sent.
5. **Given** a user on the Scheduled Emails page, **When** they reschedule a pending
   email to a new time, **Then** the updated time is saved and the email delivers at the
   new scheduled time.

---

### User Story 5 — Dashboard & Analytics (Priority: P5)

An authenticated user opens the dashboard to get a quick overview of their email activity:
total emails sent this month, pending scheduled emails, per-client activity, and an
AI-generated monthly summary. A quick compose button lets them jump directly to the
compose flow.

**Why this priority**: The dashboard provides situational awareness and acts as the
product's home base. It reinforces the value delivered and surfaces actionable next steps
(pending emails, inactive clients).

**Independent Test**: A user with at least one sent email and one scheduled email can
view the dashboard and verify all four stat sections display correct counts matching
their actual email records.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they open the dashboard, **Then** they see the
   total count of emails sent in the current calendar month.
2. **Given** a user with 2 pending scheduled emails, **When** they view the dashboard,
   **Then** the pending count displays "2".
3. **Given** a user with clients who have received emails, **When** they view the
   dashboard, **Then** each client shows their email count and the date of the last email.
4. **Given** a user at the end of a month, **When** they view the dashboard, **Then**
   an AI-generated summary paragraph describes their email activity patterns for the month.
5. **Given** a user on the dashboard, **When** they click "Quick Compose", **Then** they
   are taken directly to the Compose page with no pre-filled client.

---

### Edge Cases

- What happens when a PDF is password-protected or contains only scanned images (no
  extractable text)?
- How does the system handle a Gmail OAuth token that cannot be refreshed (e.g., user
  revoked access in Google settings)?
- What happens if a scheduled email's recipient address bounces?
- How does the system handle duplicate client email addresses?
- What happens when a Free plan user is mid-compose and hits the 10-email limit before
  sending?
- How does the system handle a scheduled email when the user's plan has downgraded
  between scheduling and delivery?

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & Account**

- **FR-001**: System MUST allow users to register with a unique email address and password.
- **FR-002**: System MUST allow users to authenticate using Google OAuth as the sole login method.
- **FR-003**: System MUST maintain authenticated sessions using short-lived tokens with
  automatic refresh (users MUST NOT be asked to log in more than once per device per session).
- **FR-004**: System MUST allow users to reset their password via a verified email link.

**Gmail Integration**

- **FR-005**: System MUST allow authenticated users to connect their Gmail account via
  Google OAuth, requesting only the permission to send emails.
- **FR-006**: All outbound emails MUST be delivered from the user's connected Gmail address,
  never from a shared MailMind AI address.
- **FR-007**: System MUST allow users to disconnect Gmail from the Settings page; disconnection
  MUST pause all pending scheduled emails immediately.
- **FR-008**: Gmail OAuth tokens MUST be refreshed automatically without user interaction;
  on unrecoverable refresh failure the user MUST be notified and prompted to reconnect.

**Plan Enforcement**

- **FR-009**: System MUST enforce Free plan limits at the server layer: maximum 10 emails
  sent per calendar month and maximum 3 stored clients.
- **FR-010**: When a plan limit is reached, the system MUST block the action and present
  an upgrade prompt; it MUST NOT silently discard the action.

**Client Management**

- **FR-011**: System MUST allow authenticated users to create client records with: name
  (required), email address (required), phone (optional), company (optional), address (optional).
- **FR-012**: System MUST validate that the client email field contains a properly formatted
  email address.
- **FR-013**: System MUST allow users to edit any field of an existing client record.
- **FR-014**: System MUST allow users to delete a client; deletion MUST NOT delete the
  historical email records associated with that client.
- **FR-015**: System MUST display a chronological email history for each client, showing
  subject, send date, and delivery status.

**AI Email Generation**

- **FR-016**: System MUST accept a PDF file upload and extract its text content for AI
  context; if text extraction fails, the system MUST notify the user and offer manual text
  input as a fallback.
- **FR-017**: System MUST accept free-text description input as AI context.
- **FR-018**: AI MUST classify the email context into one of four types: invoice,
  payment reminder, project update, or proposal; the detected type MUST be displayed to
  the user before the email preview.
- **FR-019**: Users MUST be able to correct the AI-detected type if it is wrong, causing
  the email to be regenerated with the corrected type.
- **FR-020**: AI MUST generate both a subject line and a full email body.
- **FR-021**: System MUST offer three tone options — Friendly, Formal, Strict — applied
  to AI generation; changing the tone MUST regenerate the email.
- **FR-022**: System MUST display the AI-generated email in a preview pane before any
  send or schedule action is available.
- **FR-023**: Users MUST be able to edit the subject and body in the preview pane; edits
  MUST be preserved as-is (the system MUST NOT overwrite user edits with AI output).
- **FR-024**: When both the primary and fallback AI models are unavailable, the system MUST
  present a manual compose form allowing the user to write and send the email without AI.

**Send & Schedule**

- **FR-025**: System MUST send emails immediately when the user confirms "Send Now".
- **FR-026**: System MUST allow users to specify a future date and time and save the email
  as a scheduled delivery.
- **FR-027**: System MUST automatically deliver scheduled emails at the specified time.
- **FR-028**: Scheduled emails that fail to deliver MUST be set to a "failed" status, the
  user MUST receive a notification, and the email MUST be retryable from the Scheduled
  Emails page.
- **FR-029**: Users MUST be able to cancel a pending scheduled email at any time before
  its delivery time.
- **FR-030**: Users MUST be able to reschedule a pending email to a new date and time.

**Dashboard & Analytics**

- **FR-031**: Dashboard MUST display the count of emails sent in the current calendar month.
- **FR-032**: Dashboard MUST display the count of emails in "scheduled" status.
- **FR-033**: Dashboard MUST display per-client activity showing last email date and total
  emails sent to that client.
- **FR-034**: Dashboard MUST display an AI-generated narrative summary of the user's email
  activity for the current month.

### Key Entities

- **User**: A registered account holder. Has a plan tier (free/pro/business), a Gmail
  connection status, and an optional email signature. Identified by email address.
- **Client**: A contact associated with a user. Requires name and email; optionally stores
  phone, company, and address. A user may have multiple clients; a client belongs to one user.
- **Email**: A message record belonging to a user and linked to a client. Has subject, body,
  AI-detected type, status (draft / scheduled / sent / failed), scheduled-at timestamp, and
  sent-at timestamp.
- **Document**: A PDF uploaded by a user. Stores the extracted text content. Linked to a user.
  Used as input context for AI generation; not stored as a binary file.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can complete account creation, Gmail connection, add a client,
  and send their first AI-generated email in under 5 minutes.
- **SC-002**: AI email generation (from confirmed input to preview displayed) completes in
  under 10 seconds under normal load.
- **SC-003**: 90% of AI-generated email previews require no more than minor copy edits before
  the user confirms sending.
- **SC-004**: Scheduled emails are delivered within 5 minutes of their specified scheduled time.
- **SC-005**: Plan limits (Free: 10 emails/month, 3 clients) are enforced on 100% of
  server-side send and create-client requests.
- **SC-006**: Users can complete the Gmail OAuth connection flow in under 60 seconds from
  clicking "Connect Gmail" to arriving on the dashboard.
- **SC-007**: Zero emails are sent from a shared platform address — all outbound mail originates
  from the user's own connected Gmail address.
- **SC-008**: Failed scheduled emails generate a user-visible notification within 10 minutes
  of the delivery failure.

## Assumptions

- Google OAuth consent screen will list only the Gmail send scope; no read or delete access is
  requested, aligning with the Security & Privacy First constitution principle.
- The pricing model (Free / Pro Rs. 999/month / Business Rs. 2,499/month) and plan limits are
  stable for the Phase 1–2 launch and will not require dynamic configuration.
- PDF text extraction handles standard machine-generated PDFs; OCR for scanned-image PDFs is
  out of scope for Phase 1.
- AI monthly summary generation runs on the same AI pipeline as email generation; no separate
  analytics model is required.
- Team member management (Business plan, up to 5 members) is in scope but at lower priority
  than the core solo-user flow; it is addressed in US2 client management but may ship in a
  later iteration.

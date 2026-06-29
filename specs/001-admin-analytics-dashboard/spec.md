# Feature Specification: Admin Developer Analytics Dashboard

**Feature Branch**: `001-admin-analytics-dashboard`
**Created**: 2026-06-28
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Overview KPIs at a Glance (Priority: P1)

A developer opens the admin dashboard and immediately sees headline numbers: total registered users, total emails sent all-time, current scheduled queue depth, and count of failed emails today — all on a single screen without scrolling.

**Why this priority**: Developers need a single-pane health view to confirm the app is running correctly. All other panels are secondary to this instant triage view.

**Independent Test**: Load `/admin` — the four KPI cards must render with non-null numbers pulled from the live database within 2 seconds.

**Acceptance Scenarios**:

1. **Given** the admin visits `/admin`, **When** the page loads, **Then** four KPI cards appear: Total Users, Emails Sent (all-time), Scheduled Queue, Failed Emails (last 24 h).
2. **Given** an unauthenticated request to `/admin`, **When** no valid admin secret is present, **Then** the page returns a 401 and renders an "Access denied" screen.
3. **Given** the database is empty, **When** the admin loads the dashboard, **Then** all KPI cards display `0` rather than erroring.

---

### User Story 2 — User Growth & Plan Distribution (Priority: P2)

The developer wants to see how many new users signed up each day over the past 30 days, and what fraction are on the free vs pro plan.

**Why this priority**: Conversion and growth are the two most business-critical metrics; they inform whether to invest in more features or focus on marketing.

**Independent Test**: The "Users" panel renders a 30-day bar chart and a plan-split donut chart. Hovering a bar shows the date and user count.

**Acceptance Scenarios**:

1. **Given** user records exist across multiple days, **When** the admin views the Users panel, **Then** a bar chart shows daily sign-ups for the last 30 days.
2. **Given** users with plan `free` and `pro` exist, **When** the admin views the Plan Distribution donut, **Then** it shows the correct percentages for each plan.
3. **Given** no new sign-ups in a date range, **When** the chart renders, **Then** bars for those days show `0` (no gaps in the x-axis).

---

### User Story 3 — Email Send Statistics & Failure Rate (Priority: P2)

The developer wants a 30-day timeline of emails sent vs failed, broken down by email type (invoice, payment_reminder, etc.) and delivery status.

**Why this priority**: Email delivery reliability is a core product promise; a spike in failures needs to surface immediately.

**Independent Test**: The "Emails" panel shows a stacked bar chart (sent vs failed per day) and a breakdown table by `ai_detected_type`.

**Acceptance Scenarios**:

1. **Given** emails with `status='sent'` and `status='failed'` exist, **When** the admin views the Emails panel, **Then** a stacked chart shows daily sent (green) vs failed (red) counts over 30 days.
2. **Given** emails of various `ai_detected_type` values, **When** the breakdown table renders, **Then** each type row shows count and percentage of total.
3. **Given** all emails succeeded today, **When** the failure rate badge renders, **Then** it shows `0%` in green, not hidden.

---

### User Story 4 — Agent Usage (Priority: P3)

The developer wants to see how frequently the conversational agent is used: total messages logged, daily trend over 14 days, and split between free and pro users.

**Why this priority**: Agent is a high-cost feature; usage data informs rate-limit tuning and model cost projections.

**Independent Test**: The "Agent" panel shows a 14-day line chart of `agent_message_logs` counts with a free/pro split.

**Acceptance Scenarios**:

1. **Given** `agent_message_logs` rows exist, **When** the admin views the Agent panel, **Then** a line chart shows daily message counts for the last 14 days.
2. **Given** free and pro users both sent agent messages, **When** the chart renders, **Then** two lines appear: one for free users, one for pro users.
3. **Given** the `agent_message_logs` table is empty, **When** the chart renders, **Then** a flat line at zero is shown — not an error.

---

### User Story 5 — Cron Job Health (Priority: P3)

The developer can see whether the scheduled-email cron job is delivering reliably: last run time, emails processed in the last run, succeeded/failed breakdown per run over the last 7 days.

**Why this priority**: Scheduled delivery is a Pro feature. Silent cron failure means users miss their deadlines — this must be detectable from the dashboard without tailing logs.

**Independent Test**: The "Cron Health" panel shows a table of the last 7 cron windows with columns: window, processed, succeeded, failed.

**Acceptance Scenarios**:

1. **Given** scheduled emails have been processed, **When** the admin views Cron Health, **Then** a table shows each 5-minute window with processed/succeeded/failed counts for the past 24 hours.
2. **Given** a window where `failed > 0`, **When** the table renders, **Then** the failed count cell is highlighted in red.
3. **Given** no scheduled emails ran yet, **When** the cron table renders, **Then** a message "No scheduled emails processed yet" appears.

---

### User Story 6 — Gmail Connection Rate (Priority: P4)

The developer can see what percentage of users have connected their Gmail account.

**Why this priority**: Gmail connection is a prerequisite for the core email-send feature; a low rate may indicate onboarding friction.

**Independent Test**: A single metric card shows "Gmail Connected: X / Y users (Z%)".

**Acceptance Scenarios**:

1. **Given** some users have `gmail_token IS NOT NULL`, **When** the metric renders, **Then** it shows connected count, total count, and percentage.
2. **Given** all users have Gmail disconnected, **When** the metric renders, **Then** it shows `0 / Y (0%)`.

---

### Edge Cases

- What happens when the admin secret header is missing or wrong? → 401 page, no data leaked.
- What if a Supabase query times out? → Show a per-panel error state ("Failed to load — retry") without crashing other panels.
- What if `agent_message_logs` does not yet exist in the database? → The Agent panel shows an error state and logs a warning; all other panels remain functional.
- What if the dashboard is accessed from a mobile browser? → Panels stack vertically; charts scroll horizontally — layout must not break below 375 px wide.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard MUST be protected by a server-side secret (env var `ADMIN_SECRET`); any request without the correct `X-Admin-Secret` header or `?secret=` query param MUST receive a 401 response.
- **FR-002**: The dashboard MUST NOT expose individual user PII (names, emails); all data MUST be aggregated counts.
- **FR-003**: The system MUST provide a single API endpoint (`GET /api/admin/stats`) that returns all analytics data in one response, using the Supabase service-role client to bypass RLS.
- **FR-004**: The dashboard MUST display four headline KPI cards: Total Users, All-time Emails Sent, Current Scheduled Queue, Failed Emails (last 24 h).
- **FR-005**: The Users panel MUST show a 30-day daily sign-up bar chart and a plan-distribution donut (free vs pro).
- **FR-006**: The Emails panel MUST show a 30-day stacked bar chart (sent vs failed per day) and an email-type breakdown table.
- **FR-007**: The Agent panel MUST show a 14-day daily usage line chart with free/pro split, plus a total messages count.
- **FR-008**: The Cron Health panel MUST show a table of the last 24 hours of 5-minute cron windows: window timestamp, emails processed, succeeded, failed.
- **FR-009**: The Gmail metric MUST show connected count, total user count, and connection percentage.
- **FR-010**: Each panel MUST handle its own error state independently (one failing query MUST NOT blank the whole dashboard).
- **FR-011**: The dashboard page MUST be located at `/admin` and MUST NOT appear in the app's regular navigation.
- **FR-012**: All data MUST refresh on page load; a manual "Refresh" button MUST re-fetch without a full page reload.

### Key Entities

- **AdminStats**: Aggregated analytics payload returned by `/api/admin/stats`; contains user growth series, plan counts, email series, agent usage series, cron window records, Gmail connection count.
- **CronWindow**: A 5-minute time bucket derived from `emails.sent_at` where `scheduled_at IS NOT NULL`; fields: window start, processed, succeeded, failed.
- **DailyBucket**: A date-keyed count used for all time-series charts (sign-ups, emails sent, agent messages).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The dashboard page loads and all panels display data within 3 seconds on a standard broadband connection.
- **SC-002**: An unauthenticated request to `/admin` or `/api/admin/stats` MUST return 401 in 100% of test cases.
- **SC-003**: All six panels (KPIs, Users, Emails, Agent, Cron Health, Gmail Rate) render correct data matching direct Supabase queries.
- **SC-004**: A single panel query failure leaves the remaining five panels functional 100% of the time.
- **SC-005**: The dashboard is fully usable on screens ≥ 375 px wide (mobile-safe layout).
- **SC-006**: No individual user email address, name, or ID appears anywhere on the rendered page.

## Assumptions

- The `ADMIN_SECRET` env var is set in `.env.local` and Vercel. The developer accesses the dashboard by visiting `/admin?secret=<value>` or setting a header — a simple cookie-based session is not required for v1.
- The `agent_message_logs` table already exists in Supabase (created as part of the conversational agent feature). If it doesn't exist yet, the Agent panel degrades gracefully.
- Cron health is derived from the `emails` table (rows where `scheduled_at IS NOT NULL` and `status IN ('sent','failed')`) grouped into 5-minute buckets — no separate cron-log table is needed.
- Charts are rendered client-side using a lightweight library already compatible with the Next.js/Tailwind stack; no new charting library is prescribed here.
- The dashboard is developer-only and internal; no additional access-control tiers (roles, teams) are needed for v1.

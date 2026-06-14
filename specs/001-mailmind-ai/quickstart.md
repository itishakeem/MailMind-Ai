# Quickstart: MailMind AI — Full Product

**Branch**: `001-mailmind-ai` | **Date**: 2026-06-12

This guide validates that a completed implementation is working end-to-end.
Run each section in order; each section corresponds to one user story.

---

## Prerequisites

```bash
# Required env vars in .env.local
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
GOOGLE_CLIENT_ID=<oauth-client-id>
GOOGLE_CLIENT_SECRET=<oauth-client-secret>
GMAIL_REDIRECT_URI=http://localhost:3000/api/gmail/callback
OPENROUTER_API_KEY=<openrouter-key>
NVIDIA_API_KEY=<nvidia-nim-key>
ENCRYPTION_KEY=<32-byte-hex-random-secret>
CRON_SECRET=<random-secret-for-cron-auth>
```

```bash
npm install
npm run dev
# App running at http://localhost:3000
```

---

## US1 — Account Creation & Gmail Connection

### Step 1: Register with email/password

```
1. Open http://localhost:3000
2. Click "Sign Up"
3. Fill: name="Test User", email="test@example.com", password="password123"
4. Click "Create Account"
```
**Expected**: Redirected to `/settings/gmail` or onboarding screen showing "Connect Gmail".

### Step 2: Connect Gmail

```
1. Click "Connect Gmail"
2. Google consent screen appears with: "MailMind AI wants to send email on your behalf"
3. Approve
```
**Expected**: Redirected to `/dashboard` with success toast. Settings page shows Gmail
address connected.

### Step 3: Verify token stored encrypted

```sql
-- In Supabase SQL Editor:
SELECT gmail_token FROM users WHERE email = 'test@example.com';
-- Expected: non-null, starts with a hex IV prefix (e.g., "a3f2c1...:...")
-- Must NOT be a plain JSON string containing access_token
```

### Step 4: Disconnect Gmail

```
1. Go to /settings
2. Click "Disconnect Gmail"
3. Confirm the dialog
```
**Expected**: Gmail section shows "Not connected"; dashboard shows reconnect prompt.

---

## US2 — Client Management

### Step 5: Add clients

```
1. Go to /clients
2. Click "Add Client"
3. Fill: name="Ahmed Khan", email="ahmed@example.com", phone="03001234567"
4. Save
5. Add a second client: name="Sara Malik", email="sara@example.com"
6. Add a third client: name="Bilal Co", email="bilal@example.com"
```
**Expected**: All three clients appear in the list.

### Step 6: Test Free plan limit

```
1. Try to add a fourth client
```
**Expected**: Action blocked; upgrade prompt shown; HTTP 402 from /api/clients.

### Step 7: Edit and delete

```
1. Click "Ahmed Khan" → Edit → change phone to "03009999999" → Save
2. Delete "Bilal Co"
```
**Expected**: Ahmed's phone updated. Bilal Co removed. Two clients remain.

---

## US3 — AI Email Generation & Immediate Send

*Reconnect Gmail first (from US1 Step 2) before this section.*

### Step 8: Generate email from text description

```
1. Go to /compose
2. Select client: "Ahmed Khan"
3. Choose "Write description"
4. Type: "Website design is complete, need to collect Rs. 15,000, due in 7 days"
5. Click "Detect Type"
```
**Expected**: AI detects type = "Invoice". Displayed to user for confirmation.

### Step 9: Generate with tone

```
1. Confirm type = "Invoice"
2. Select tone = "Formal"
3. Click "Generate Email"
```
**Expected**: Preview shows subject like "Invoice for Website Design Services — Rs. 15,000"
and a professional body. Generated in under 10 seconds.

### Step 10: Edit and send

```
1. Edit the subject to add "- URGENT"
2. Click "Send Now"
```
**Expected**: 
- Email sent from the test user's Gmail (visible in Gmail Sent folder)
- Client history for Ahmed Khan shows 1 sent email
- Dashboard emails_sent_this_month incremented

### Step 11: PDF upload

```
1. Go to /compose
2. Select client: "Sara Malik"
3. Choose "Upload PDF"
4. Upload a sample invoice PDF
```
**Expected**: Text extracted; AI detects "Invoice" or "Payment Reminder"; email generated.

### Step 12: Test AI fallback (manual compose mode)

```
# Temporarily set OPENROUTER_API_KEY=invalid and NVIDIA_API_KEY=invalid in .env.local
# Restart dev server
1. Go to /compose
2. Select a client
3. Type a description and click "Generate Email"
```
**Expected**: AI unavailable banner shown; manual compose form displayed; user can type
subject/body manually and send.

```
# Restore valid API keys after test
```

---

## US4 — Email Scheduling

### Step 13: Schedule an email

```
1. Go to /compose
2. Select client: "Ahmed Khan"
3. Type a description → Generate email
4. Click "Schedule" (instead of "Send Now")
5. Set scheduled time = NOW + 3 minutes
6. Confirm
```
**Expected**: 
- Email appears on /scheduled with status "scheduled"
- Email record in database has status="scheduled" and scheduled_at set

### Step 14: Verify cron delivery

```
# Wait 3–5 minutes
1. Check /scheduled page
2. Check Ahmed Khan's client history
3. Check test user's Gmail Sent folder
```
**Expected**: Email status changed to "sent"; appears in client history and Gmail.

### Step 15: Cancel a scheduled email

```
1. Schedule another email (NOW + 10 minutes)
2. Go to /scheduled
3. Click "Cancel" on the new email
```
**Expected**: Email removed from the scheduled list; never sent.

---

## US5 — Dashboard & Analytics

### Step 16: Verify dashboard stats

```
1. Go to /dashboard
```
**Expected** (based on the emails sent above):
- `emails_sent_this_month`: at least 2 (from US3 tests)
- `scheduled_count`: 0 (after cancellation in US4)
- Per-client activity: Ahmed Khan shows count ≥ 1 and a last sent date
- Monthly summary: non-empty paragraph describing activity

### Step 17: Quick compose navigation

```
1. On /dashboard, click "Quick Compose"
```
**Expected**: Redirected to /compose with no pre-selected client.

---

## Validation Checklist

After completing all steps, confirm:

- [ ] Emails arrive from the user's Gmail address (not a MailMind AI address) — US1/US3
- [ ] Free plan blocks 4th client — US2
- [ ] AI generation under 10 seconds — US3
- [ ] Manual compose mode activates when both AI models are unavailable — US3
- [ ] Scheduled email delivered within 5 minutes of scheduled time — US4
- [ ] Dashboard shows accurate counts matching actual email records — US5
- [ ] gmail_token in database is encrypted (not plain text) — US1
- [ ] Disconnecting Gmail pauses scheduled emails — US1

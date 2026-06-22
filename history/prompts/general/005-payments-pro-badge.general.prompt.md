---
id: "005"
title: Lemon Squeezy Payments and PRO Badge
stage: general
date: 2026-06-19
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Abdul Hakeem
command: "now lets add real payment method to recieve payment from pro users and when user purchase pro plan thier should be an option on dashboard and profile of user that PRO.also suggest me for pro users"
labels: ["payments", "lemonsqueezy", "pro-badge", "subscription", "billing"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - backend/supabase/migrations/009_subscriptions.sql
  - frontend/app/api/payments/checkout/route.ts
  - frontend/app/api/payments/webhook/route.ts
  - frontend/app/api/payments/portal/route.ts
  - frontend/components/ui/ProBadge.tsx
  - frontend/app/(dashboard)/dashboard/page.tsx
  - frontend/app/(dashboard)/profile/page.tsx
  - frontend/components/layout/Sidebar.tsx
  - frontend/components/ui/UpgradePrompt.tsx
  - frontend/.env.example
tests:
  - TypeScript type check passed (exit code 0)
---

## Prompt

now lets add real payment method to recieve payment from pro users and when user purchase pro plan thier should be an option on dashboard and profile of user that PRO.also suggest me for pro users

## Response snapshot

Implemented full Lemon Squeezy payment integration + PRO badge system:

**Payment integration (Lemon Squeezy chosen — best for Pakistani/South Asian developers):**
- `009_subscriptions.sql`: Added `lemon_squeezy_customer_id` and `lemon_squeezy_subscription_id` columns to users table
- `POST /api/payments/checkout`: Creates LS checkout session, embeds user_id as custom_data, redirects user to hosted checkout
- `POST /api/payments/webhook`: Verifies HMAC-SHA256 signature, handles subscription_created/updated/expired events, upgrades/downgrades user plan in Supabase
- `POST /api/payments/portal`: Returns LS customer portal URL for managing/cancelling subscription

**PRO badge:**
- `ProBadge` component: Glowing animated badge for "pro" and "business" plans, 3 sizes (sm/md/lg)
- Dashboard welcome: Shows ProBadge next to "Welcome back, Ahmed 👋"
- Profile page: Shows ProBadge instead of plain plan badge, adds "Upgrade to Pro" button (free) or "Manage Subscription" button (pro)
- Sidebar: Upgrade button now calls checkout API directly; Pro plan box shows "Manage Plan" button calling portal API
- UpgradePrompt: Upgrade button now calls checkout API instead of linking to pricing page

**Webhook logic:**
- PRO access: subscription_created, subscription_updated with status in [on_trial, active, past_due, cancelled]
- Downgrade to free: subscription_expired, subscription_updated with status [expired, unpaid]
- user_id is passed via custom_data at checkout creation time

## Outcome

- ✅ Impact: Full payment flow from click → checkout → webhook → plan upgrade, with PRO badge visible on dashboard and profile
- 🧪 Tests: TypeScript check passed (exit code 0)
- 📁 Files: 10 files created/modified
- 🔁 Next prompts: Set up Lemon Squeezy store + add product + configure webhook URL in LS dashboard
- 🧠 Reflection: Using custom_data.user_id at checkout creation is the cleanest way to link LS events to Supabase users without requiring a customer lookup

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): tsc --noEmit passed
- Prompt variant (if applicable): n/a
- Next experiment: Add webhook event logging table for debugging payment issues in production

---
id: "007"
title: "Fix Pro Plan Checkout CTA"
stage: general
date: 2026-06-22
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Abdul Hakeem
command: general
labels: ["payments", "lemon-squeezy", "landing-page", "ux", "checkout"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/app/page.tsx
tests:
  - TypeScript: npx tsc --noEmit — PASS (zero errors)
---

## Prompt

the payment page leave coming soon when user click on pro it get coming soon.

## Response snapshot

Root cause: The Pro plan CTA on the landing page (`frontend/app/page.tsx`) was a `<Link href="/auth/signup">` — clicking it went to the signup page, not the payment/checkout flow. This made Pro feel like "Coming Soon" because no payment ever started.

**Fix applied** — `frontend/app/page.tsx`:
1. Added `useState` import from React
2. Added `proLoading` state and `handleProCheckout()` async function inside `HomePage`:
   - POSTs to `/api/payments/checkout`
   - On success (`data.url`): redirects to Lemon Squeezy checkout
   - On 401 (not logged in) or any error: falls back to `/auth/signup`
3. Changed Pro card CTA from `<Link href="/auth/signup">` to `<button onClick={handleProCheckout}>` with loading state
4. Free plan CTA unchanged — still links to `/auth/signup`
5. Business plan CTA unchanged — still "Coming Soon" / "Join Waitlist"

**Logic flow after fix**:
- Logged-in free user clicks "Start Pro" → checkout API → Lemon Squeezy checkout URL → payment
- Not-logged-in user clicks "Start Pro" → checkout API returns 401 → fallback to `/auth/signup`
- TypeScript: clean (tsc --noEmit, zero errors)

## Outcome

- ✅ Pro plan CTA now triggers the actual payment checkout flow
- ✅ Non-logged-in users gracefully fall back to signup
- ✅ Free and Business plans unaffected
- ⚠️ Checkout still requires Lemon Squeezy env vars: LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, LEMONSQUEEZY_PRO_VARIANT_ID

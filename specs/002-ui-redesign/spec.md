# Feature Specification: MailMind AI — Professional UI Redesign with Animations

**Feature Branch**: `002-ui-redesign`
**Created**: 2026-06-13
**Status**: Active
**Input**: User request: "update ui with animations and professional attractive look"

## Overview

The current UI is functional but visually minimal — plain white backgrounds, basic gray borders, no animations. This spec defines a professional visual redesign that adds depth, motion, and brand identity across all surfaces while preserving all existing functionality.

## Design Principles

1. **Motion with Purpose**: Animations communicate hierarchy and guide attention; no gratuitous motion.
2. **Dark-First Landing**: The public landing page uses a dark, tech-forward aesthetic to signal quality.
3. **Light Dashboard**: The authenticated app stays in a light theme for readability during work sessions, with a dark sidebar for clear context separation.
4. **Consistent Brand Gradient**: Primary brand gradient is blue→indigo→violet (`#1e40af → #4f46e5 → #7c3aed`).
5. **Glass Morphism Accents**: Translucent glass cards with blur backdrop used on dark surfaces.
6. **No Breaking Changes**: All routing, data-fetching, and business logic remain unchanged.

## Acceptance Scenarios

### AS-001 — Landing Page Visual Quality
**Given** a visitor loads `/`, **Then** they see a dark hero with animated floating gradient orbs, gradient text on the headline, smooth fade-in entrance animation, and feature cards with hover lift effects.

### AS-002 — Landing Page Interactivity
**Given** a visitor hovers a feature card, **Then** the card lifts (translateY) and its border brightens within 200ms.

### AS-003 — Auth Page Visual Quality
**Given** a user visits `/auth/login` or `/auth/signup`, **Then** they see a rich gradient background (dark blue to indigo), a glass-morphism card, and polished input fields with focus ring animations.

### AS-004 — Sidebar Navigation
**Given** an authenticated user views the sidebar, **Then** the sidebar uses a dark slate background, the active route has a gradient highlight (blue→indigo), and nav items animate on hover.

### AS-005 — Navbar Polish
**Given** an authenticated user views the navbar, **Then** it has a blur-backdrop effect, a gradient logo mark, and polished status badges.

### AS-006 — StatCards on Dashboard
**Given** the dashboard loads, **Then** each StatCard has a colored gradient accent bar, a relevant icon, and lifts on hover.

### AS-007 — Page Entrance Animations
**Given** any dashboard page loads, **Then** content fades in and slides up staggered (100ms delay between elements) so the page feels alive on arrival.

### AS-008 — No Functionality Regression
**Given** any animated element exists, **Then** clicking links, submitting forms, and navigating still works identically to before the redesign.

## Scope

### In Scope
- `app/globals.css` — animation keyframes, glass utilities, gradient text, card hover
- `tailwind.config.ts` — animation config, extended color palette
- `app/page.tsx` — full landing page redesign
- `app/auth/layout.tsx` — gradient background with glass card
- `components/auth/LoginForm.tsx` — polished inputs
- `components/auth/SignupForm.tsx` — polished inputs
- `components/layout/Navbar.tsx` — blur backdrop, gradient logo
- `components/layout/Sidebar.tsx` — dark sidebar with gradient active states
- `components/dashboard/StatCard.tsx` — gradient accent, icon, hover lift
- `app/(dashboard)/dashboard/page.tsx` — staggered animations on sections

### Out of Scope
- API routes, data models, business logic
- Mobile hamburger menu / sidebar collapse (future task)
- Dark mode toggle for authenticated app
- Compose, Clients, Scheduled page-level redesigns (follow-on)

## Success Criteria

- **SC-001**: All animations run at 60fps; no jank on Chrome/Edge/Firefox.
- **SC-002**: First Contentful Paint on landing page is not degraded by more than 200ms.
- **SC-003**: All existing routes, forms, and API calls continue to work after redesign.
- **SC-004**: No TypeScript errors introduced.
- **SC-005**: Color contrast ratios meet WCAG AA on all text/background combinations.

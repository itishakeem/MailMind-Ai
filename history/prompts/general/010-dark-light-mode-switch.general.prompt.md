---
id: "010"
title: "Dark Mode and Light Mode Switch"
stage: general
date: 2026-06-23
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Abdul Hakeem
command: general
labels: ["dark-mode", "theme", "css-variables", "ui"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/app/globals.css
  - frontend/components/ThemeProvider.tsx
  - frontend/app/layout.tsx
  - frontend/components/layout/Navbar.tsx
  - frontend/components/layout/Sidebar.tsx
  - frontend/components/dashboard/StatCard.tsx
  - frontend/app/(dashboard)/dashboard/page.tsx
  - frontend/app/(dashboard)/settings/page.tsx
  - frontend/app/(dashboard)/profile/page.tsx
  - frontend/app/(dashboard)/scheduled/page.tsx
  - frontend/app/(dashboard)/clients/[id]/page.tsx
tests: []
---

## Prompt

now create switch for lightmode and dark mode

## Response

### Architecture

Used a CSS variable + `data-mode` attribute approach — no Tailwind dark mode config needed.

**Semantic token variables added to globals.css:**
- `--bg-page`, `--bg-surface`, `--bg-surface-2`, `--bg-input`
- `--text-1`, `--text-2`, `--text-3`
- `--border`, `--border-2`
- `--shadow-sm`, `--shadow-md`
- `--navbar-bg`, `--navbar-border`

Light mode values on `:root`; dark mode values on `[data-mode="dark"]`.

**Tailwind class overrides in globals.css:**
`.bg-white`, `.bg-gray-50`, `.text-gray-900`, `.text-gray-500`, `.text-gray-400`, etc. — all automatically remapped to CSS variables in dark mode. This means most page components needed zero changes for their Tailwind text color classes.

**Anti-FOUC script** (`layout.tsx`) updated to also apply saved `data-mode` attribute before React hydrates — prevents flash on page load.

### Toggle placement
- **Navbar**: Moon/Sun icon button (always visible, uses CSS vars for its own styling)
- **Sidebar**: Same toggle in the theme picker section header (moon/sun)

### Files changed and what changed in each
- `globals.css` — semantic tokens + Tailwind overrides + skeleton dark update
- `ThemeProvider.tsx` — added `mode` state, `toggleMode()`, `MODE_STORAGE_KEY`
- `layout.tsx` — updated anti-FOUC inline script
- `Navbar.tsx` — added `"use client"`, `useTheme` hook, toggle button, CSS var styles
- `Sidebar.tsx` — added moon/sun toggle to theme section header
- `StatCard.tsx` — replaced `bg-white` + hardcoded border/shadow with CSS vars
- `dashboard/page.tsx` — updated 2 inline card divs with hardcoded border/shadow
- `settings/page.tsx` — cardStyle + textarea background/border
- `profile/page.tsx` — cardStyle + both input focus border styles
- `scheduled/page.tsx` — cardStyle
- `clients/[id]/page.tsx` — cardStyle

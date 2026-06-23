---
id: "009"
title: "Debug Theme Not Applying in Whole App"
stage: general
date: 2026-06-23
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Abdul Hakeem
command: general
labels: ["theme", "css", "glow", "keyframes", "bug"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/app/globals.css
tests: []
---

## Prompt

now debug the themes why it is not applying in all background and whole app

## Response

### Root Cause

The theme system sets `data-theme` on `<html>` and updates `--a-*` CSS variables correctly. However, all glow animation keyframes and several utility classes used hardcoded indigo-specific `rgba()` values instead of CSS variables, so they never updated when switching themes.

**Hardcoded indigo values that didn't respond to theme changes:**
- All 8 `@keyframes` declarations: `neonPulse`, `proCardGlow`, `textGlow`, `badgeGlow`, `btnGlowPulse`, `iconGlow`, `logoGlow`, `borderPulse`, `pulseGlow`
- `.glow-border` and `.glow-border:hover`
- `.glow-text`
- `.neon-card` and `.neon-card:hover`
- `.nav-item-active`
- `.gradient-text` and `.gradient-text-static`

### Fix

1. Added `--a-rgb` (raw RGB channel triplet) to each theme block so it can be used inside `rgba()`:
   - Indigo: `99, 102, 241`
   - Ocean: `8, 145, 178`
   - Sunset: `225, 29, 72`
   - Forest: `52, 211, 153`
   - Aurora: `139, 92, 246`

2. Replaced every hardcoded `rgba(99,102,241, N)`, `rgba(79,70,229, N)`, and `rgba(129,140,248, N)` in keyframes and utility classes with `rgba(var(--a-rgb), N)`.

3. Updated `.gradient-text` and `.gradient-text-static` to use `var(--a-gradient)` instead of hardcoded blue/indigo gradients.

**Result:** All glow effects, pulse animations, hover borders, and gradient text now fully update when the user switches themes via the sidebar theme picker.

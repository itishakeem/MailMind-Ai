# Plan: MailMind AI — Professional UI Redesign with Animations

**Feature Branch**: `002-ui-redesign`
**Created**: 2026-06-13
**Spec**: `specs/002-ui-redesign/spec.md`

## Architecture

### Animation System (globals.css + tailwind.config.ts)

All animations are defined once in `globals.css` as `@keyframes` blocks and exposed through:
1. Tailwind `animation` / `keyframes` config for utility-class usage (`animate-fade-in-up`, etc.)
2. Custom CSS utility classes for non-Tailwind patterns (`glass`, `glass-dark`, `gradient-text`, `card-hover`)

**Keyframes defined:**
| Name | Purpose |
|------|---------|
| `fadeInUp` | Page entrance — content fades in and slides up 24px |
| `fadeIn` | Simple opacity fade for overlays |
| `gradientShift` | Animated gradient text / background hue cycling |
| `float` | Slow vertical bobbing for decorative orbs |
| `pulseGlow` | Box-shadow pulse on interactive buttons |

**Animation delay convention**: Stagger siblings via inline `style={{ animationDelay: 'Xms' }}` — avoids Tailwind JIT purge issues with dynamic delay values.

### Color System Extension

Extend Tailwind with a brand-complete palette + explicit slate colors for the dark sidebar:

```
brand:  50→900 (existing blues kept)
slate: 800=#1e293b, 900=#0f172a (dark sidebar)
indigo: 600=#4f46e5, 700=#4338ca
violet: 600=#7c3aed
```

Hero background: `#0a0f1e` (near-black with blue tint) — defined inline rather than as a Tailwind token to avoid class-name length.

### Surface Strategy

| Surface | Background | Text | Accent |
|---------|-----------|------|--------|
| Landing hero | `#0a0f1e` | white | blue→indigo gradient |
| Landing features | `#0a0f1e` + glass card | white/60 | per-card color |
| Landing pricing | `#0a0f1e` | white | indigo for highlight |
| Auth layout | `bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900` | — | — |
| Auth card | glass (white/10 + blur) | white | blue |
| Sidebar | `bg-slate-900` | white/60 | blue→indigo active gradient |
| Navbar | white + `backdrop-blur-md` | gray-900 | — |
| Dashboard main | `bg-gray-50` | gray-900 | — |
| StatCard | white + left gradient bar | gray-900 | color-coded per stat |

### Component Changes

#### `app/globals.css`
- Add 5 `@keyframes` blocks
- Add `.glass`, `.glass-dark`, `.gradient-text`, `.card-hover`, `.animate-*` utility classes
- Add CSS custom properties for gradient definitions

#### `tailwind.config.ts`
- Extend `animation` with all 5 named animations
- Extend `keyframes` with matching definitions
- Extend `colors` with `slate.800/900`, `indigo.600/700`, `violet.600`
- Add `backgroundImage.hero-gradient`

#### `app/page.tsx` (Landing)
- `"use client"` to enable `useState`/`useEffect` for entrance animation trigger
- Fixed animated orbs behind all content via `fixed` positioned divs with `blur-3xl`
- Nav: glass backdrop, gradient logo mark (square with "M"), pill CTA
- Hero: badge pill → gradient headline → body copy → CTA row → stats bar (3 metrics)
- Features: glass cards with per-card color icon container, hover lift
- Pricing: glass cards, highlighted card with gradient border + glow
- Footer: minimal, dark

#### `app/auth/layout.tsx`
- Full-screen gradient background
- Glass card (white/10 bg, white/20 border, backdrop-blur-xl)
- Gradient logo mark + title above card

#### `components/auth/LoginForm.tsx` + `SignupForm.tsx`
- Input: dark bg (white/5), white/20 border, white text, white/20 focus ring — matches glass card
- Label: white/70
- Submit button: gradient blue→indigo with glow shadow
- Error: red/20 bg with red/80 border

#### `components/layout/Navbar.tsx`
- `border-b border-white/10 bg-white/80 backdrop-blur-md` — subtle glass
- Logo: gradient square mark + bold text
- Gmail status: green/amber dot with pill
- Plan badge: colored pill per plan

#### `components/layout/Sidebar.tsx`
- `bg-slate-900 border-r border-slate-800` — dark
- Logo area at top: brand mark + name in white
- Nav items: white/50 default → white active; active bg = `bg-gradient-to-r from-blue-600/20 to-indigo-600/20` with left border accent `border-l-2 border-blue-500`
- Hover: `hover:bg-white/5 hover:text-white/80`

#### `components/dashboard/StatCard.tsx`
- Left accent bar: 4px wide, full height, gradient per stat color (cycle through 4)
- Icon in gradient circle (40px)
- Hover: `group` + `hover:-translate-y-1 hover:shadow-lg transition-all`
- Accept optional `icon` and `accentColor` props with sensible defaults

#### `app/(dashboard)/dashboard/page.tsx`
- Wrap each section in `animate-fade-in-up` with incremental `style={{ animationDelay }}` for stagger
- Pass `icon` and `accentColor` to StatCards

## Key Decisions

### Decision 1: Client component for landing page
Landing page becomes `"use client"` to support the `isVisible` state toggle that drives entrance animation. The cost is a tiny client bundle addition; the benefit is smooth animated entrance with zero layout shift.

**Alternative considered**: CSS-only animations with `opacity: 0` initial state — rejected because it causes FOUC (Flash of Unstyled Content) before hydration.

### Decision 2: Inline animation delays vs Tailwind delay utilities
Tailwind JIT generates delay classes only for values seen in source — dynamic values like `${i * 100}ms` are purged. Inline `style` is the safe pattern for dynamic stagger.

### Decision 3: Keep dashboard in light theme
The work surface (dashboard) stays light for readability and contrast with data. Only the sidebar goes dark to give navigation a clear visual hierarchy. This avoids a full dark-mode implementation which is out of scope.

## Risk Analysis

| Risk | Mitigation |
|------|-----------|
| Tailwind purge removes custom animation classes | Define in `globals.css` with explicit class names; add `safelist` entry if needed |
| Glass blur degrades on low-end hardware | `backdrop-filter` falls back gracefully to semi-opaque solid fill |
| `"use client"` on landing page breaks SSR SEO | Hero content still renders on server; `isVisible` only controls CSS class toggled after mount |
| StatCard prop additions break existing callers | New props are optional with defaults; zero breaking changes |

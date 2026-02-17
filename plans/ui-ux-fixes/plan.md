# UI/UX Fixes - Mobile Accessibility & Design System

**Branch:** `feature/ui-ux-mobile-fixes`
**Description:** Fix mobile navigation, touch targets, typography, semantic HTML, and design tokens for WCAG AA compliance

## Goal

Complete 7 small UI/UX improvements to enhance mobile accessibility, ensure design system consistency, and improve touch-based interaction. These fixes address gaps identified in the UI/UX spec (`docs/product/ui_ux.md`) and align with the mobile-first, touch-optimized design principles.

## Research Summary

**Current State Analysis:**

- ✅ MobileNav exists but **POS link is missing** (only shows Dashboard, Inventory, Reports, Settings)
- ❌ No touch-target utility class (44×44px minimum per WCAG)
- ⚠️ Button default size is h-9 (36px) - too small for mobile CTAs
- ⚠️ Input default size is h-9 (36px) - should be h-12 (48px) per spec
- ❌ Semantic HTML landmarks not consistently applied (missing `<main>`, proper `<nav>`)
- ⚠️ POS category chips use `px-3 py-1.5` (~28px height) - below 44px minimum
- ❌ Using Geist font instead of Inter (per `docs/product/roadmap.md` line 142)
- ⚠️ Missing color tokens (info, neutral, etc.) - only basic tokens defined

**Key References:**

- Mobile touch targets: `docs/product/ui_ux.md` lines 1700-1720 (WCAG 44×44px minimum)
- Typography: `docs/product/roadmap.md` line 142 (Inter font required)
- Navigation: `components/layouts/MobileNav.tsx` missing POS (should show 5 items)
- Current font: `app/globals.css` line 84 (Geist)

---

## Implementation Steps

### Step 1: Add POS to Mobile Navigation & Fix Touch Targets

**Files:**

- components/layouts/MobileNav.tsx
- app/globals.css

**What:**
Add the missing POS navigation item to MobileNav and define a reusable `.touch-target` utility class for 44×44px minimum touch areas. Currently, MobileNav only shows 4 items (Dashboard, Inventory, Reports, Settings) but POS is a primary feature for staff users per the spec.

**Changes:**

- MobileNav.tsx: Add POS (ShoppingCart icon) between Dashboard and Inventory
- MobileNav.tsx: Update touch target classes from `min-w-12` to `min-w-11 min-h-11` (44px)
- globals.css: Add `.touch-target { min-width: 44px; min-height: 44px; }` utility

**Testing:**

- [ ] Open http://localhost:3000/dashboard on mobile viewport (375px)
- [ ] Verify 5 nav items visible: Dashboard, **POS**, Inventory, Reports, Settings
- [ ] Verify POS icon is ShoppingCart from lucide-react
- [ ] Measure nav item dimensions in DevTools - should be ≥44×44px
- [ ] Tap each nav item - all should be easily tappable with thumb

---

### Step 2: Fix Button & Input Touch Compliance

**Files:**

- components/ui/button.tsx
- components/ui/input.tsx

**What:**
Update button and input component sizes to meet 44-56px touch target requirements for mobile. Current defaults (h-9 = 36px) are below the WCAG minimum. Primary CTA buttons need to be 56px (xl size), inputs need to be 48px.

**Changes:**

- button.tsx: Add `xl: "h-14 rounded-lg px-8 text-base"` to size variants (56px for CTAs)
- button.tsx: Update icon sizes: `icon: "size-11"` (44px minimum)
- button.tsx: Update default: `h-10` (40px) for standard actions
- input.tsx: Change default height from `h-9` to `h-12` (48px)
- input.tsx: Increase padding: `px-4 py-3` for better thumb clearance

**Testing:**

- [ ] Visit http://localhost:3000/login and inspect button
- [ ] "Sign in" button height should measure 40px (h-10) or 56px if size="xl"
- [ ] Input fields should measure 48px (h-12)
- [ ] All form elements should feel comfortable to tap on mobile

---

### Step 3: Add Semantic HTML Landmarks

**Files:**

- app/(dashboard)/layout-client.tsx
- components/layouts/Sidebar.tsx
- components/layouts/MobileNav.tsx

**What:**
Wrap page content in proper HTML5 semantic elements (`<main>`, `<aside>`, `<nav>`) for accessibility. Currently using generic `<div>` wrappers which don't provide semantic context for screen readers or keyboard navigation.

**Changes:**

- layout-client.tsx: Wrap `{children}` in `<main className="..." role="main">`
- Sidebar.tsx: Ensure `<aside>` has `role="navigation"` and `aria-label="Main navigation"`
- MobileNav.tsx: Ensure `<nav>` has `aria-label="Mobile navigation"`
- Header.tsx: Add `<header>` semantic tag if not already present

**Testing:**

- [ ] Run accessibility audit: Chrome DevTools → Lighthouse → Accessibility
- [ ] Verify landmarks present: main, aside, nav
- [ ] Test keyboard navigation: Tab through page, proper focus order
- [ ] Use screen reader (optional): VoiceOver/NVDA should announce landmarks

---

### Step 4: Fix POS Category Chip Touch Targets

**Files:**

- app/(dashboard)/pos/page.tsx

**What:**
Increase category filter chips from ~28px height to 44px minimum. Currently using `px-3 py-1.5` which creates small touch targets. These chips are frequently tapped during POS usage and must meet mobile standards.

**Changes:**

- pos/page.tsx: Update category button classes:
  - From: `px-3 py-1.5` → To: `px-4 py-2.5 min-h-11` (44px)
  - Add: `touch-target` class
  - Ensure: `rounded-full` maintained for pill shape

**Testing:**

- [ ] Visit http://localhost:3000/pos on mobile viewport (375px)
- [ ] Measure category chip height in DevTools - should be ≥44px
- [ ] Tap "All", "Pods", "Mods", etc. - should be easy to hit without mis-taps
- [ ] Verify active state has green gradient background

---

### Step 5: Switch to Inter Font

**Files:**

- app/layout.tsx
- app/globals.css
- package.json (if needed)

**What:**
Replace Geist font with Inter as specified in design system (`docs/product/roadmap.md` line 142). Inter is the official brand font for VapeTrack and provides better readability on mobile screens with Filipino character support.

**Changes:**

- layout.tsx: Import Inter from `next/font/google`
- layout.tsx: Apply font class to `<body>`
- globals.css: Update `--font-sans` from 'Geist' to Inter variable
- Remove Geist font references

**Example:**

```tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
```

**Testing:**

- [ ] Inspect any text element in DevTools → Computed → font-family
- [ ] Should show "Inter" instead of "Geist"
- [ ] Verify no FOUT (flash of unstyled text) on page load
- [ ] Test on real device - font should render cleanly

---

### Step 6: Add Missing Color Tokens

**Files:**

- app/globals.css

**What:**
Add semantic color tokens missing from the design system: info (blue), neutral (gray), and surface variants. Current palette only has primary/destructive/accent but lacks common utility colors needed for alerts, badges, and UI states.

**Changes:**

- Add to `:root` and `.dark`:
  ```css
  --info: #3b82f6; /* Blue 500 - info messages */
  --info-foreground: #f5f5f5; /* White text on info */
  --neutral: #737373; /* Neutral 500 - disabled states */
  --neutral-foreground: #a3a3a3; /* Neutral 400 */
  --surface-elevated: #2d2d2d; /* Slightly lighter than card */
  ```
- Add Tailwind mappings in `@theme inline`:
  ```css
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
  --color-neutral: var(--neutral);
  --color-neutral-foreground: var(--neutral-foreground);
  ```

**Testing:**

- [ ] Run `npm run build` - no CSS errors
- [ ] Use in component: `bg-info text-info-foreground`
- [ ] Verify colors render correctly in browser
- [ ] Check contrast ratios: info text should meet WCAG AA (4.5:1)

---

## Success Criteria

**Functional:**

- [ ] All 5 navigation items visible on mobile (Dashboard, POS, Inventory, Reports, Settings)
- [ ] All touch targets measure ≥44×44px in DevTools
- [ ] Forms usable with thumb on 375px viewport
- [ ] Category chips easy to tap without mis-taps

**Visual:**

- [ ] Inter font renders on all pages
- [ ] Button CTAs are visually larger (56px height with size="xl")
- [ ] Input fields are taller (48px)
- [ ] Category chips look proportional (44px height)

**Accessibility:**

- [ ] Lighthouse accessibility score ≥90
- [ ] Semantic landmarks present (main, nav, aside)
- [ ] Screen reader announces proper roles
- [ ] Keyboard navigation works (Tab order logical)

**Code Quality:**

- [ ] `npm run build` succeeds with no errors
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Touch-target utility class reusable across codebase

---

## Risk Assessment

**Low Risk:**

- Font change (visual only, no functional impact)
- Touch-target utility (additive, no breaking changes)
- Color tokens (extends existing palette)

**Medium Risk:**

- Button/Input size changes might affect existing layouts expecting smaller components
- Semantic HTML changes could affect existing CSS selectors (unlikely with Tailwind)

**Mitigation:**

- Test all pages after each step
- Verify responsive behavior at 375px, 768px, 1024px viewports
- Run E2E tests to catch navigation regressions
- Check existing button/input usages - may need size prop adjustments

---

## Dependencies

**Required:**

- Tailwind CSS v4 (already installed)
- lucide-react icons (already installed)
- next/font/google (built into Next.js)

**None needed:**

- No new packages required
- All changes use existing tools

---

## Time Estimates

- Step 1: Add POS to mobile nav + touch-target utility: **3 min**
- Step 2: Fix button & input sizes: **3 min**
- Step 3: Add semantic HTML landmarks: **2 min**
- Step 4: Fix POS category chip touch targets: **2 min**
- Step 5: Switch to Inter font: **3 min**
- Step 6: Add missing color tokens: **2 min**

**Total Estimated Time:** ~15 minutes
**Testing & Verification:** ~10 minutes
**Total:** ~25 minutes

---

## Related Documentation

- `docs/product/ui_ux.md` - Complete UI/UX specification
- `docs/product/roadmap.md` lines 114-165 - Design system requirements
- `plans/ui-ux-spec-compliance/` - Previous UI compliance work
- WCAG 2.1 Level AA: Touch target guidelines (44×44px minimum)

---

## Notes

**What This Fixes:**

- Mobile navigation completeness (missing POS link)
- Touch accessibility for mobile users
- Design system consistency (Inter font, proper sizes)
- Semantic HTML for screen readers
- Missing utility class for touch targets

**Out of Scope:**

- Dashboard page implementation (already done)
- Staff PIN login (future feature)
- Offline PWA capabilities (Phase 2)
- Advanced animations (not critical for MVP)

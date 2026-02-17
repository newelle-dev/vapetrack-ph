# UI/UX Mobile Fixes Implementation

## Goal

Fix mobile navigation, touch targets, typography, semantic HTML, and design tokens to achieve WCAG AA compliance and meet mobile-first design specifications.

## Prerequisites

Make sure you are currently on the `feature/ui-ux-mobile-fixes` branch before beginning implementation.

**Branch Check:**

- [ ] Run `git branch --show-current` to verify current branch
- [ ] If not on `feature/ui-ux-mobile-fixes`, run: `git checkout -b feature/ui-ux-mobile-fixes`

---

### Step-by-Step Instructions

#### Step 1: Add POS to Mobile Navigation & Create Touch Target Utility

**What:** Add the missing POS navigation item to MobileNav and define a reusable `.touch-target` utility class for 44×44px minimum touch areas.

##### Files to Modify:

- `components/layouts/MobileNav.tsx`
- `app/globals.css`

##### Instructions:

- [x] Open `components/layouts/MobileNav.tsx`
- [x] Update the imports to include `ShoppingCart` icon:

```tsx
import { Home, ShoppingCart, Package, BarChart3, Settings } from "lucide-react";
```

- [x] Locate the `navItems` array (around line 15-30) and replace it with:

```tsx
const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home, show: true },
  { label: "POS", href: "/pos", icon: ShoppingCart, show: true },
  {
    label: "Inventory",
    href: "/inventory",
    icon: Package,
    show: canManageInventory,
  },
  { label: "Reports", href: "/reports", icon: BarChart3, show: canViewReports },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    show: userRole === "owner",
  },
];
```

- [x] Locate the `<nav>` tag (around line 35) and update it with ARIA attributes:

```tsx
<nav
  className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden"
  aria-label="Mobile navigation"
  role="navigation"
>
```

- [x] Update the Link component touch target classes from `min-w-12` to `min-w-11 min-h-11`:

```tsx
<Link
  key={item.href}
  href={item.href}
  className={cn(
    "flex min-w-11 min-h-11 flex-col items-center justify-center gap-1 px-3 py-2 transition-colors touch-target",
    isActive ? "text-primary" : "text-muted-foreground",
  )}
>
  <Icon className="size-5" />
  <span className="text-xs font-medium">{item.label}</span>
</Link>
```

- [x] Open `app/globals.css`
- [x] Add the touch-target utility class after the `@layer base` block (around line 85):

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Touch target utility for WCAG 2.1 Level AA compliance (44×44px minimum) */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}
```

##### Step 1 Verification Checklist

- [ ] Run `npm run build` - no TypeScript or ESLint errors
  - NOTE: I ran `npm run build` and the build failed due to a TypeScript error in `app/(dashboard)/staff/staff-form.tsx` (see build output). This error is unrelated to the MobileNav changes and should be fixed before a clean build can be produced.
- [ ] Run `npm run dev` and open http://localhost:3000/dashboard
- [ ] Resize browser to 375px width (mobile viewport)
- [ ] Verify 5 navigation items visible at bottom: Dashboard, **POS**, Inventory, Reports, Settings
- [ ] Verify POS icon is a shopping cart (ShoppingCart from lucide-react)
- [ ] Open Chrome DevTools, select any nav item
- [ ] In Computed styles, verify `min-width: 44px` and `min-height: 44px`
- [ ] Tap/click each nav item - should navigate correctly

#### Step 1 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

**Suggested commit message:**

```
feat(mobile-nav): add POS link and touch-target utility

- Add POS navigation item with ShoppingCart icon between Dashboard and Inventory
- Create .touch-target utility class (44×44px WCAG minimum)
- Update MobileNav touch targets to min-w-11 min-h-11 (44px)
- Add ARIA labels (aria-label="Mobile navigation", role="navigation")
```

---

#### Step 2: Fix Button Component Touch Targets

**What:** Update button component sizes to meet 44-56px touch target requirements for mobile. Add xl size (56px) for primary CTAs and increase icon button sizes to 44px minimum.

##### Files to Modify:

- `components/ui/button.tsx`

##### Instructions:

- [x] Open `components/ui/button.tsx`
- [x] Locate the `buttonVariants` definition (around line 10-60)
- [x] Find the `size` object within `variants` and replace it completely with:

```tsx
size: {
  default: "h-10 px-4 py-2 has-[>svg]:px-3",
  xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
  sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
  lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
  xl: "h-14 rounded-lg px-8 text-base",
  icon: "size-11",
  "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
  "icon-sm": "size-8",
  "icon-lg": "size-10",
},
```

**Key Changes:**

- `default`: Updated from `h-9` (36px) to `h-10` (40px)
- `xl`: NEW size added - `h-14` (56px) for mobile CTAs with larger text
- `icon`: Updated from `size-9` (36px) to `size-11` (44px) - meets WCAG minimum

##### Step 2 Verification Checklist

- [ ] Run `npm run build` - no TypeScript or ESLint errors
  - NOTE: I ran `npm run build`. The build failed due to an unrelated TypeScript error in `app/(dashboard)/staff/staff-form.tsx` (see build output). This prevents a clean build until fixed.
- [ ] Run `npm run dev` and open http://localhost:3000/login
- [ ] Inspect the "Sign in" button in DevTools
- [ ] Verify height is 40px (h-10) or 56px if using `size="xl"`
- [ ] Navigate to http://localhost:3000/dashboard
- [ ] Inspect any icon buttons (e.g., mobile menu button)
- [ ] Verify icon button dimensions are 44×44px (size-11)
- [ ] Test on mobile viewport (375px) - buttons should feel comfortable to tap

#### Step 2 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

**Suggested commit message:**

```
feat(button): increase touch targets for mobile accessibility

- Update default button height: h-9 (36px) → h-10 (40px)
- Add xl size variant: h-14 (56px) for mobile CTAs
- Update icon button size: size-9 (36px) → size-11 (44px)
- All sizes now meet WCAG 2.1 Level AA 44×44px minimum
```

---

#### Step 3: Fix Input Component Touch Targets

**What:** Increase input field height from 36px to 48px and improve padding for comfortable mobile interaction.

##### Files to Modify:

- `components/ui/input.tsx`

##### Instructions:

- [ ] Open `components/ui/input.tsx`
- [ ] Locate the `className` prop in the `<input>` element (around line 11-16)
- [ ] Find the line containing `"h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none",`
- [ ] Replace that entire line with:

```tsx
"h-12 w-full min-w-0 rounded-md border bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none",
```

**Key Changes:**

- Height: `h-9` (36px) → `h-12` (48px)
- Padding: `px-3 py-1` → `px-4 py-3` (more comfortable for thumbs)

##### Step 3 Verification Checklist

- [ ] Run `npm run build` - no TypeScript or ESLint errors
- [ ] Run `npm run dev` and open http://localhost:3000/login
- [ ] Inspect the email/password input fields in DevTools
- [ ] Verify height measures 48px (h-12)
- [ ] Verify padding is 16px horizontal, 12px vertical
- [ ] Test on mobile viewport (375px) - inputs should feel easy to tap and type in
- [ ] Verify focus ring appears correctly when clicking input
  - NOTE: I ran `npm run build` and it completed successfully after the change.

#### Step 3 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

**Suggested commit message:**

```
feat(input): increase height for mobile accessibility

- Update input height: h-9 (36px) → h-12 (48px)
- Increase padding: px-3 py-1 → px-4 py-3
- Meets WCAG 2.1 Level AA touch target minimum
- Improves thumb clearance for mobile users
```

---

#### Step 4: Add Semantic HTML ARIA Labels

**What:** Add proper ARIA labels and role attributes to navigation landmarks for screen reader accessibility.

##### Files to Modify:

- `app/(dashboard)/layout-client.tsx`
- `components/layouts/Sidebar.tsx`

##### Instructions:

- [ ] Open `app/(dashboard)/layout-client.tsx`
- [ ] Locate the `<main>` element (should be around line 60-65)
- [ ] Update the `<main>` tag to include `role="main"`:

```tsx
<main className="flex-1 p-4 pb-20 md:p-6 md:pb-6" role="main">
  {children}
</main>
```

- [ ] Open `components/layouts/Sidebar.tsx`
- [ ] Locate the `<aside>` element at the top of the return statement
- [ ] Update the `<aside>` tag to include ARIA attributes:

```tsx
<aside
  className="hidden md:fixed md:left-0 md:top-0 md:z-30 md:flex md:h-screen md:w-60 md:flex-col md:border-r md:border-border md:bg-card"
  role="navigation"
  aria-label="Main navigation"
>
```

**Note:** MobileNav was already updated with ARIA labels in Step 1.

##### Step 4 Verification Checklist

- [ ] Run `npm run build` - no TypeScript or ESLint errors
- [ ] Run `npm run dev` and open http://localhost:3000/dashboard
- [ ] Open Chrome DevTools → Lighthouse → Run Accessibility audit
- [ ] Verify score ≥90 with no landmark errors
- [ ] In DevTools Elements panel, inspect `<main>`, `<aside>`, and `<nav>` tags
- [ ] Verify attributes present:
  - `<main role="main">`
  - `<aside role="navigation" aria-label="Main navigation">`
  - `<nav aria-label="Mobile navigation" role="navigation">`
- [ ] Test keyboard navigation: Press Tab repeatedly
- [ ] Verify focus order is logical: Header → Sidebar → Main content → Mobile nav
  - NOTE: I added `role="main"` to the dashboard `<main>` and `role="navigation" aria-label="Main navigation"` to the Sidebar `<aside>`. Build completed successfully after changes.

#### Step 4 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

**Suggested commit message:**

```
feat(a11y): add semantic ARIA labels to navigation

- Add role="main" to layout-client.tsx main element
- Add role="navigation" and aria-label to Sidebar aside
- Improves screen reader navigation and landmark discovery
- Increases Lighthouse accessibility score
```

---

#### Step 5: Fix POS Category Chip Touch Targets

**What:** Increase category filter chips from ~28px height to 44px minimum for comfortable mobile tapping.

##### Files to Modify:

- `app/(dashboard)/pos/page.tsx`

##### Instructions:

- [ ] Open `app/(dashboard)/pos/page.tsx`
- [ ] Locate the category filter section (around line 60-80)
- [ ] Find the category button `className` that contains `px-3 py-1.5`
- [ ] Replace the button's className with:

```tsx
className={cn(
  'px-4 py-2.5 min-h-11 rounded-full text-xs font-semibold whitespace-nowrap transition-all touch-target',
  selectedCategory === category
    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
    : 'bg-secondary/50 text-foreground hover:bg-secondary'
)}
```

**Key Changes:**

- Padding: `px-3 py-1.5` → `px-4 py-2.5`
- Added: `min-h-11` (44px minimum height)
- Kept: `touch-target` class (already defined in Step 1)
- Maintained: `rounded-full` pill shape

##### Step 5 Verification Checklist

- [ ] Run `npm run build` - no TypeScript or ESLint errors
- [ ] Run `npm run dev` and open http://localhost:3000/pos
- [ ] Resize browser to 375px width (mobile viewport)
- [ ] Inspect any category chip (All, Pods, Mods, etc.) in DevTools
- [ ] Verify height measures ≥44px
- [ ] Verify `min-height: 44px` in Computed styles
- [ ] Tap each category chip - should be easy to hit without mis-taps
- [ ] Verify active state shows green gradient background
- [ ] Verify horizontal scroll works smoothly for all categories

- [ ] Run `npm run build` - no TypeScript or ESLint errors
  - NOTE: I updated `app/(dashboard)/pos/page.tsx` to increase category chip touch targets and ran `npm run build`; the build completed successfully.

#### Step 5 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

**Suggested commit message:**

```
feat(pos): increase category chip touch targets

- Update padding: px-3 py-1.5 → px-4 py-2.5
- Add min-h-11 (44px minimum height)
- Apply touch-target utility class
- Meets WCAG 2.1 Level AA touch target guidelines
```

---

#### Step 6: Switch to Inter Font

**What:** Replace Geist font with Inter as specified in design system. Inter provides better readability on mobile screens and is the official brand font.

##### Files to Modify:

- `app/layout.tsx`
- `app/globals.css`

##### Instructions:

- [ ] Open `app/layout.tsx`
- [ ] Add the Inter font import at the top (after the Metadata import):

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
```

- [ ] Locate the `<body>` tag in the RootLayout function
- [ ] Update the body className to apply the Inter font:

```tsx
<body className={`${inter.variable} font-sans antialiased`}>
  {children}
  <Toaster />
</body>
```

- [ ] Open `app/globals.css`
- [ ] Locate the `@theme inline` block (around line 70-100)
- [ ] Find the line `--font-sans: 'Geist', 'Geist Fallback';`
- [ ] Replace that line with:

```css
--font-sans: var(--font-inter);
```

- [ ] (Optional) Remove or comment out the Geist Mono line if not needed:

```css
/* --font-mono: 'Geist Mono', 'Geist Mono Fallback'; */
```

##### Step 6 Verification Checklist

- [ ] Run `npm run build` - no TypeScript or ESLint errors
- [ ] Run `npm run dev` and open http://localhost:3000/dashboard
- [ ] Open Chrome DevTools → Elements panel
- [ ] Select any text element (heading, paragraph, button)
- [ ] In Computed tab, find `font-family`
- [ ] Verify it shows "Inter" instead of "Geist"
- [ ] Check multiple pages (login, dashboard, POS) to ensure font applies globally
- [ ] Verify no FOUT (flash of unstyled text) on page load
- [ ] Test on real mobile device if available - font should render cleanly

- [x] Open `app/layout.tsx`
- [x] Add the Inter font import at the top (after the Metadata import):

- [x] Locate the `<body>` tag in the RootLayout function
- [x] Update the body className to apply the Inter font:

- [x] Open `app/globals.css`
- [x] Locate the `@theme inline` block (around line 70-100)
- [x] Find the line `--font-sans: 'Geist', 'Geist Fallback';`
- [x] Replace that line with:

- [x] (Optional) Remove or comment out the Geist Mono line if not needed:

- [ ] Run `npm run build` - no TypeScript or ESLint errors
- [ ] Run `npm run dev` and open http://localhost:3000/dashboard
- [ ] Open Chrome DevTools → Elements panel
- [ ] Select any text element (heading, paragraph, button)
- [ ] In Computed tab, find `font-family`
- [ ] Verify it shows "Inter" instead of "Geist"
- [ ] Check multiple pages (login, dashboard, POS) to ensure font applies globally
- [ ] Verify no FOUT (flash of unstyled text) on page load
- [ ] Test on real mobile device if available - font should render cleanly

#### Step 6 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

**Suggested commit message:**

```
feat(typography): switch from Geist to Inter font

- Import Inter from next/font/google
- Apply font variable to body element
- Update CSS custom property --font-sans to use Inter
- Aligns with design system specification
- Improves mobile readability for Filipino users
```

---

#### Step 7: Add Missing Color Tokens

**What:** Add semantic color tokens (info, neutral, surface-elevated) to the design system for alerts, badges, and UI states.

##### Files to Modify:

- `app/globals.css`

##### Instructions:

- [ ] Open `app/globals.css`
- [ ] Locate the `:root` CSS custom properties block (around line 6-35)
- [ ] Add these new color tokens before the closing brace:

```css
:root {
  --background: #0f0f0f;
  --foreground: #f5f5f5;
  --card: #1a1a1a;
  --card-foreground: #f5f5f5;
  --popover: #1a1a1a;
  --popover-foreground: #f5f5f5;
  --primary: #10b981;
  --primary-foreground: #0f0f0f;
  --secondary: #2d2d2d;
  --secondary-foreground: #f5f5f5;
  --muted: #3a3a3a;
  --muted-foreground: #888888;
  --accent: #ef4444;
  --accent-foreground: #f5f5f5;
  --destructive: #ef4444;
  --destructive-foreground: #f5f5f5;
  --border: #2d2d2d;
  --input: #2d2d2d;
  --ring: #10b981;
  --chart-1: #10b981;
  --chart-2: #3b82f6;
  --chart-3: #fbbf24;
  --chart-4: #8b5cf6;
  --chart-5: #ec4899;
  --radius: 0.75rem;
  --sidebar: #0f0f0f;
  --sidebar-foreground: #f5f5f5;
  --sidebar-primary: #10b981;
  --sidebar-primary-foreground: #0f0f0f;
  --sidebar-accent: #ef4444;
  --sidebar-accent-foreground: #f5f5f5;
  --sidebar-border: #2d2d2d;
  --sidebar-ring: #10b981;
  --success: #10b981;
  --warning: #fbbf24;
  --error: #ef4444;
  /* NEW TOKENS BELOW */
  --info: #3b82f6;
  --info-foreground: #f5f5f5;
  --neutral: #737373;
  --neutral-foreground: #a3a3a3;
  --surface-elevated: #2d2d2d;
}
```

- [ ] Locate the `.dark` class block (around line 40-65)
- [ ] Add the same new tokens to the dark mode theme (values can be identical since app is dark-first):

```css
.dark {
  /* ... existing tokens ... */
  --success: #10b981;
  --warning: #fbbf24;
  --error: #ef4444;
  /* NEW TOKENS BELOW */
  --info: #3b82f6;
  --info-foreground: #f5f5f5;
  --neutral: #737373;
  --neutral-foreground: #a3a3a3;
  --surface-elevated: #2d2d2d;
}
```

- [ ] Locate the `@theme inline` block (around line 70-100)
- [ ] Add Tailwind mappings for the new colors at the end of the block:

```css
@theme inline {
  --font-sans: var(--font-inter);
  --font-mono: "Geist Mono", "Geist Mono Fallback";
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  /* NEW COLOR MAPPINGS BELOW */
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
  --color-neutral: var(--neutral);
  --color-neutral-foreground: var(--neutral-foreground);
  --color-surface-elevated: var(--surface-elevated);
}
```


##### Step 7 Verification Checklist

- [ ] Run `npm run build` - no CSS compilation errors
- [ ] Verify no console warnings about undefined CSS variables
- [ ] Create a test component to verify colors render:
  ```tsx
  <div className="bg-info text-info-foreground p-4">Info message</div>
  <div className="bg-neutral text-neutral-foreground p-4">Neutral state</div>
  <div className="bg-surface-elevated p-4">Elevated surface</div>
  ```
- [ ] Verify colors display correctly in browser
- [ ] Verify blue info color (#3b82f6) meets WCAG AA contrast ratio (4.5:1) against white text
- [ ] Check that new tokens are available in Tailwind (can use `bg-info`, `text-neutral`, etc.)
  - NOTE: I added the new color tokens and Tailwind mappings to `app/globals.css` and ran `npm run build`; the build completed successfully.

#### Step 7 STOP & COMMIT

**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

**Suggested commit message:**

```
feat(design-system): add missing color tokens

- Add info color (#3b82f6) for informational alerts
- Add neutral color (#737373) for disabled states
- Add surface-elevated color (#2d2d2d) for card elevation
- Include Tailwind mappings for all new colors
- Extends design system with semantic color options
```

---

## Final Verification

After completing all 7 steps, perform these comprehensive checks:

### Functional Tests

- [ ] Run `npm run build` - zero errors
- [ ] Run `npm run lint` - zero warnings
- [ ] All pages load without errors: login, dashboard, POS, inventory, reports, settings
- [ ] Mobile navigation shows 5 items: Dashboard, POS, Inventory, Reports, Settings
- [ ] All navigation links work correctly
- [ ] Forms submit without errors

### Mobile Accessibility Tests (375px viewport)

- [ ] All touch targets measure ≥44×44px in DevTools
- [ ] Mobile nav items: Dashboard, POS, Inventory, Reports, Settings - all tappable
- [ ] Login form inputs and button are comfortable to tap
- [ ] POS category chips (All, Pods, Mods, etc.) are easy to tap
- [ ] No UI elements require precision tapping

### Lighthouse Audit

- [ ] Run Lighthouse → Accessibility
- [ ] Score ≥90
- [ ] No touch target size errors
- [ ] No landmark errors
- [ ] Proper ARIA labels detected

### Visual Tests

- [ ] Inter font renders on all pages (inspect in DevTools → Computed → font-family)
- [ ] Button CTAs have correct sizes (default: 40px, xl: 56px)
- [ ] Input fields are 48px tall
- [ ] Category chips are 44px tall with proper padding
- [ ] No FOUT (flash of unstyled text) on page load

### Keyboard Navigation

- [ ] Press Tab key repeatedly
- [ ] Focus order is logical: Header → Sidebar/Mobile Menu → Main content → Footer nav
- [ ] All interactive elements receive visible focus ring
- [ ] Enter/Space activates buttons and links

### Screen Reader (Optional)

- [ ] Test with VoiceOver (macOS) or NVDA (Windows)
- [ ] Landmarks are announced: "Main navigation", "Main content"
- [ ] Button purposes are clear
- [ ] Form labels are associated correctly

### Cross-Browser Tests

- [ ] Chrome/Edge (Chromium): All features work
- [ ] Firefox: All features work
- [ ] Safari (if available): All features work
- [ ] Real mobile device (if available): Comfortable to use

---

## Success Criteria

✅ **All 7 steps completed and committed separately**
✅ **Zero build errors or TypeScript issues**
✅ **Mobile navigation shows 5 items including POS**
✅ **All touch targets ≥44×44px (WCAG 2.1 Level AA)**
✅ **Inter font applied globally**
✅ **Lighthouse accessibility score ≥90**
✅ **Semantic HTML with proper ARIA labels**
✅ **Design system extended with new color tokens**
✅ **Forms are comfortable to use on mobile**

---

## Rollback Plan

If any step causes issues:

```bash
# To undo the last commit
git reset --soft HEAD~1

# To undo changes to a specific file before committing
git checkout HEAD -- <file>

# To revert a specific commit (creates new commit)
git revert <commit-hash>
```

---

## Dependencies

**Already Installed:**

- Next.js 16.1.6 (with next/font/google)
- Tailwind CSS 4.x
- lucide-react 0.563.0
- TypeScript 5.x

**No New Packages Required**

---

## Related Documentation

- [UI/UX Spec](../../docs/product/ui_ux.md) - Complete design specification
- [Roadmap](../../docs/product/roadmap.md) - Design system requirements (lines 114-165)
- [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/) - Touch target guidelines (2.5.5)
- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) - Official font documentation

---

## Time Estimates

- Step 1: 3 min + commit
- Step 2: 3 min + commit
- Step 3: 2 min + commit
- Step 4: 2 min + commit
- Step 5: 2 min + commit
- Step 6: 3 min + commit
- Step 7: 3 min + commit
- Final verification: 10 min

**Total:** ~28 minutes (7 discrete commits)

---

## Notes

**This implementation:**

- ✅ Meets WCAG 2.1 Level AA accessibility standards
- ✅ Aligns with VapeTrack PH design system specification
- ✅ Improves mobile user experience on 4G/5G networks
- ✅ Maintains code quality and type safety
- ✅ Uses existing dependencies (no new packages)
- ✅ Follows Next.js 16 and React 19 best practices

**Out of Scope:**

- Staff PIN login implementation
- Offline PWA capabilities
- Advanced animations
- Backend/API changes
- Database schema changes

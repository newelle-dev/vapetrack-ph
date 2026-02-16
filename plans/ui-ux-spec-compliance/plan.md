# UI/UX Specification Compliance Update

**Branch:** `feat/ui-ux-spec-compliance`
**Description:** Align currently implemented features with VapeTrack design specifications from ui_ux.md

## Goal

Update all existing pages, components, and layouts to match the VapeTrack UI/UX design system: Green 500 brand color, Inter typography, 44×44px touch targets, Slate dark surfaces, and mobile-first responsive patterns. This ensures brand consistency and optimal mobile usability across auth pages, dashboard, branches, and settings.

## Implementation Steps

### Step 1: Foundation - Color Palette & Typography

**Files:**

- app/globals.css
- app/layout.tsx

**What:**
Replace generic oklch color palette with VapeTrack-specific hex colors (Green 500 primary, Slate 950/800/700 surfaces). Add Inter font from Google Fonts. Define spacing scale (8px base), border radius values (6px-12px), and shadows per spec. This establishes the visual foundation for all subsequent changes.

**Changes:**

- globals.css: Replace entire `:root` and `.dark` color definitions with VapeTrack palette
- globals.css: Add CSS custom properties for spacing scale, border radius, shadows
- globals.css: Fix `--radius-lg` from 10px to 12px
- layout.tsx: Import Inter from `next/font/google`, apply to `<body>`
- Remove Geist font references

**Testing:**

- [ ] Inspect computed styles: `--primary` should be `#22c55e` (Green 500)
- [ ] Verify `--background` is `#0f172a` (Slate 950)
- [ ] Check Inter font loads in DevTools Network tab
- [ ] Confirm all text renders in Inter font family
- [ ] Verify `--radius-lg` is 12px in computed styles

---

### Step 2: Touch-Compliant UI Components

**Files:**

- components/ui/button.tsx
- components/ui/input.tsx
- components/ui/card.tsx

**What:**
Update core shadcn/ui components to meet 44×44px minimum touch target requirements and VapeTrack styling. Buttons get `xl` size (56px height), green gradient for primary variant, and colored shadow. Inputs increase to 48px height. Cards use branded Slate 800 background with 16px padding.

**Changes:**

- button.tsx: Add `xl` size variant (`h-14` = 56px height)
- button.tsx: Add gradient and shadow to `default` variant (`bg-gradient-to-br from-primary to-primary-600`)
- button.tsx: Update icon button sizes to minimum 44×44px
- input.tsx: Change default height from `h-9` to `h-12` (48px)
- input.tsx: Update background to `bg-slate-700` (--surface-elevated)
- card.tsx: Add explicit `bg-slate-800` background, ensure 16px padding default

**Testing:**

- [ ] Measure button heights in browser: default CTA buttons should be 56px
- [ ] Verify primary button has green gradient background
- [ ] Check input fields are 48px tall on auth pages
- [ ] Inspect card backgrounds are `#1e293b` (Slate 800)
- [ ] Test on mobile: all buttons easily tappable with thumb

---

### Step 3: Navigation Components Update

**Files:**

- components/layouts/MobileNav.tsx
- components/layouts/Header.tsx
- components/layouts/Sidebar.tsx

**What:**
Align navigation components to exact styling per spec. MobileNav keeps `h-16` (64px standard Tailwind height - close to 60px spec) with proper active state gradients. Sidebar icons ensure 24×24px sizing. All touch targets validated for 44×44px minimum.

**Changes:**

- MobileNav.tsx: Keep `h-16` height (64px - standard Tailwind, close to spec)
- MobileNav.tsx: Ensure nav items are 44×44px minimum touch targets
- MobileNav.tsx: Add green gradient to active state background
- MobileNav.tsx: Use 24×24px icons (`size={24}` prop)
- Header.tsx: Keep current `h-16` (consistent with mobile nav)
- Sidebar.tsx: Verify all icons are 24×24px, nav items have sufficient padding

**Testing:**

- [ ] Verify MobileNav maintains `h-16` (64px) height
- [ ] Verify active tab has green gradient highlight
- [ ] Check all nav icons are 24×24px in computed styles
- [ ] Test Header height is consistent at 64px on desktop
- [ ] Confirm all nav items are easily tappable on mobile (375px viewport)

---

### Step 4: Form Components & Page Updates

**Files:**

- app/(auth)/login/page.tsx
- app/(auth)/signup/page.tsx
- app/(dashboard)/branches/branch-form.tsx
- app/(dashboard)/settings/organization-settings-form.tsx
- app/(dashboard)/branches/branch-list.tsx

**What:**
Update all form implementations to use new component sizing (48px inputs, 56px buttons). Ensure consistent spacing using 8px scale (Tailwind's default aligns). Apply branded card backgrounds and proper responsive layouts per mobile-first spec.

**Changes:**

- Replace all `<Button>` CTAs with `size="xl"` variant
- Ensure `<Input>` components use updated 48px height (automatic from Step 2)
- Update form card containers to use branded backgrounds
- Apply consistent spacing (p-4 = 16px, gap-4 = 16px, etc.)
- branch-list.tsx: Update table or card grid to use Slate 800 cards

**Testing:**

- [ ] All login/signup buttons are 56px height
- [ ] Form inputs are 48px tall across all forms
- [ ] Branch form save button has green gradient
- [ ] Organization settings form maintains 16px spacing
- [ ] Forms are usable on 375px mobile viewport (iPhone SE)

---

### Step 5: Dashboard Components & Landing Page

**Files:**

- app/(dashboard)/dashboard/page.tsx
- app/page.tsx
- Create: components/dashboard/StatCard.tsx

**What:**
Create StatCard component for dashboard quick stats (followers VapeTrack card pattern: Slate 800 background, 12px border radius, 16px padding). Update landing page to redirect authenticated users to dashboard or show proper VapeTrack-branded landing content. Apply stat card to dashboard page.

**Changes:**

- Create StatCard component with props: `title`, `value`, `icon`, `trend` (optional)
- StatCard styling: bg-slate-800, rounded-xl (12px), p-4 (16px), green accent for positive trends
- dashboard/page.tsx: Replace placeholder content with 2×2 grid of StatCards (sales, inventory, branches, users)
- page.tsx: Add server-side auth check, redirect to `/dashboard` if authenticated, else show branded landing with "Get Started" CTA (56px button)

**Testing:**

- [ ] Dashboard shows 4 stat cards in responsive grid
- [ ] Stat cards have Slate 800 background, 12px border radius
- [ ] Landing page redirects authenticated users to dashboard
- [ ] Landing page "Get Started" button is 56px, green gradient
- [ ] Dashboard layout doesn't break on mobile (375px width)

---

## Success Criteria

**Visual Compliance:**

- [ ] All colors match VapeTrack palette (Green 500 primary, Slate surfaces)
- [ ] Inter font renders on all pages
- [ ] All buttons are 56px height (xl size)
- [ ] All inputs are 48px height
- [ ] Cards use Slate 800 background (#1e293b)
- [ ] Navigation is exactly 60px height (mobile bottom nav, desktop header)

**Accessibility & UX:**

- [ ] All touch targets ≥ 44×44px (test with Chrome DevTools device toolbar)
- [ ] Primary buttons have green gradient + shadow
- [ ] Active navigation states have visible green indicator
- [ ] Forms are fully usable with thumb on mobile (375px viewport)
- [ ] Text contrast passes WCAG AAA (7:1+) in dark mode

**Functional:**

- [ ] No TypeScript errors (`npm run build` succeeds)
- [ ] All existing features work (auth, branches CRUD, settings save)
- [ ] Responsive behavior intact on mobile/tablet/desktop
- [ ] Landing page redirects authenticated users correctly

**Testing Environments:**

- Desktop: Chrome on 1920×1080
- Mobile: Chrome DevTools → iPhone SE (375×667px)
- Real device: Test on actual Android/iOS device if available

---

## Out of Scope (For Future PRs)

These are identified in the audit but NOT included in this implementation:

- [ ] POS page creation (separate feature)
- [ ] ProductCard component (needs POS page first)
- [ ] Bottom sheets component (not yet used in current pages)
- [ ] Floating Action Button (no checkout flow yet)
- [ ] Animation definitions (nice-to-have enhancement)
- [ ] Skeleton loaders (future optimization)
- [ ] PWA features (later phase)

---

## Design Decisions (Confirmed)

**RESOLVED:**

1. **Mobile Nav Height:** Keep `h-16` (64px) - uses standard Tailwind class, close enough to 60px spec. ✅

2. **Button Gradient Scope:** Apply green gradient to ALL `variant="default"` buttons for consistent visual language. ✅

3. **Landing Page Content:** Authenticated users auto-redirect to `/dashboard` for faster access (aligns with PRD's speed-first principle). ✅

4. **Geist Font Removal:** Fully remove Geist and use Inter only per ui_ux.md specification. ✅

---

## Risk Assessment

**Low Risk:**

- Color palette change (CSS-only, no functional impact)
- Font change (visual only, no layout breaking)
- Component resizing (improves UX, doesn't break functionality)

**Medium Risk:**

- Navigation height changes (could affect layout spacing, needs cross-browser testing)
- Button size changes (might affect existing layouts expecting smaller buttons)

**Mitigation:**

- Test all pages after each step
- Verify responsive behavior at each breakpoint (375px, 768px, 1024px)
- Run `npm run build` after each commit to catch TypeScript errors early

---

## Estimated Timeline

**Total Effort:** ~2-3 days (solo developer)

- Step 1: 4 hours (CSS + font setup)
- Step 2: 3 hours (component updates + testing)
- Step 3: 2 hours (navigation updates)
- Step 4: 3 hours (form updates across multiple pages)
- Step 5: 3 hours (dashboard components + landing page)
- **Buffer:** 2-3 hours for cross-browser testing, bug fixes, refinement

---

## Dependencies

**Required Before Starting:**

- [x] Node.js environment set up
- [x] shadcn/ui components installed
- [x] Tailwind CSS configured
- [x] Database schema operational (for testing forms)

**External Resources:**

- Inter font: Google Fonts (https://fonts.google.com/specimen/Inter)
- Design specs: docs/product/ui_ux.md
- Color reference: Tailwind Slate palette (https://tailwindcss.com/docs/customizing-colors)

---

**Ready for Implementation:** ✅  
**Next Action:** Await clarification on the 4 design decisions above, then proceed with Step 1.

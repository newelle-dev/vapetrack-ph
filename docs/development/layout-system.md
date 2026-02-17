# Layout System Documentation

**VapeTrack PH - Design System**  
Last Updated: February 2026

## Overview

This document describes the layout system used throughout VapeTrack PH. Following these patterns ensures consistency, maintainability, and adherence to our UI/UX guidelines.

---

## Core Layout Components

### 1. Root Layout (`app/layout.tsx`)

The global wrapper for the entire application.

**Features:**
- Dark mode by default
- Inter font family
- Toaster component for notifications

**Usage:** Automatically applied to all pages.

---

### 2. Auth Layout (`app/(auth)/layout.tsx`)

Layout for authentication pages (login, signup).

**Features:**
- Centered card design
- Minimal structure
- Uses `Card` component

**Usage:** Automatically applied to pages in `(auth)` route group.

---

### 3. Dashboard Layout (`app/(dashboard)/layout.tsx`)

Server component that determines user role and delegates to appropriate client layout.

**Variants:**
- `DashboardLayoutClient` - For shop owners
- `StaffLayoutClient` - For staff members

---

### 4. DashboardLayoutClient (`app/(dashboard)/layout-client.tsx`)

Main layout for shop owners with full navigation.

**Features:**
- Desktop sidebar (240px wide, fixed position)
- Header (60px height)
- Mobile bottom navigation (64px height)
- Mobile sheet menu
- Main content area with `md:pl-60` offset

**Layout Structure:**
```
┌─────────────────────────────┐
│ Header (60px)              │
├──────────┬──────────────────┤
│ Sidebar  │ Main Content     │
│ (240px)  │ (with padding)   │
│          │                  │
│ Desktop  │                  │
│ only     │                  │
└──────────┴──────────────────┘
│ MobileNav (64px, mobile)   │
└────────────────────────────┘
```

---

### 5. PageContainer Component

**Location:** `components/layouts/page-container.tsx`

Reusable page wrapper for consistent spacing and structure across all pages.

#### Props

```typescript
interface PageContainerProps {
  children: ReactNode
  title?: string              // Page title (h1)
  subtitle?: string           // Page subtitle
  action?: ReactNode          // Action button(s) in header
  className?: string          // Additional classes
  fullHeight?: boolean        // Full viewport height (for POS)
  stickyTop?: ReactNode       // Sticky content at top
  noPaddingTop?: boolean      // Remove top padding
}
```

#### Standard Configuration

**Padding:**
- Mobile: `p-4` (16px)
- Desktop: `md:p-6` (24px)
- Bottom mobile: `pb-20` (80px) to prevent overlap with mobile nav

**Typography:**
- Title: `text-2xl font-bold` (h1)
- Subtitle: `text-sm text-muted-foreground`

#### Usage Examples

**Basic Page:**
```tsx
<PageContainer title="Dashboard" subtitle="Today's overview">
  <div>Your content here</div>
</PageContainer>
```

**Full-Height Page (e.g., POS):**
```tsx
<PageContainer 
  fullHeight 
  noPaddingTop 
  stickyTop={<SearchBar />}
>
  <div>Scrollable content</div>
</PageContainer>
```

**Page with Action Button:**
```tsx
<PageContainer 
  title="Inventory" 
  action={<Button>Add Product</Button>}
>
  <ProductList />
</PageContainer>
```

---

## Design Tokens

### Spacing

| Context | Mobile | Desktop | Class |
|---------|--------|---------|-------|
| Page padding | 16px | 24px | `p-4 md:p-6` |
| Bottom clearance | 80px | 24px | `pb-20 md:pb-6` |
| Card gap | 12px | 12px | `gap-3` |
| Section spacing | 16px | 16px | `space-y-4` |

### Border Radius

**Standard:** `rounded-xl` (12px) for all cards and containers

Do NOT use:
- `rounded-[12px]` ❌
- `rounded-[14px]` ❌  
- `rounded-[16px]` ❌

Use instead:
- `rounded-xl` ✅ (12px)
- `rounded-lg` ✅ (8px) for smaller elements

### Touch Targets

**Minimum:** 44×44px (WCAG 2.1 Level AA)

Use the `.touch-target` utility class:
```tsx
<button className="touch-target">Click me</button>
```

This applies:
```css
.touch-target {
  min-width: 44px;
  min-height: 44px;
}
```

### Typography Scale

| Element | Size | Weight | Class |
|---------|------|--------|-------|
| Page Title (h1) | 24px | Bold | `text-2xl font-bold` |
| Section Header (h3) | 14px | Bold | `text-sm font-bold` |
| Body Text | 14px | Normal | `text-sm` |
| Small Text | 12px | Normal | `text-xs` |
| Stats/Numbers | 24-32px | Bold | `text-2xl font-bold` |

---

## Navigation Components

### Header Component

**Height:** 60px (fixed)  
**Position:** Sticky top  
**Features:**
- Mobile menu button (hidden on desktop)
- Logo/brand
- User dropdown

### Sidebar Component

**Width:** 240px (60 in Tailwind)  
**Position:** Fixed left  
**Visibility:** Desktop only (`hidden md:block`)  
**Features:**
- Navigation items with active states
- Active state: `bg-accent text-accent-foreground`

### MobileNav Component

**Height:** 64px (16 in Tailwind)  
**Position:** Fixed bottom  
**Visibility:** Mobile only (`md:hidden`)  
**Features:**
- Icon + label navigation
- Active state: `text-primary bg-primary/10`
- Touch-optimized buttons (min 44×44px)

---

## Common Patterns

### Cards

**Standard Card:**
```tsx
<div className="bg-card rounded-xl border border-border/50 hover:border-border transition-colors">
  {/* Card content */}
</div>
```

**Stat Card:**
```tsx
<div className="bg-card rounded-xl p-3 border border-border/50">
  <p className="text-xs text-muted-foreground uppercase">Label</p>
  <h3 className="text-2xl font-bold">Value</h3>
</div>
```

**Alert Card:**
```tsx
<div className="bg-accent/10 border-l-4 border-accent rounded-xl p-3">
  {/* Alert content */}
</div>
```

### Gradients

**Hero/Revenue Card:**
```tsx
<div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
  {/* Content */}
</div>
```

### Sticky Elements

**Sticky Header:**
```tsx
<div className="sticky top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur">
  {/* Header content */}
</div>
```

---

## Decision Tree

### When to use PageContainer?

**✅ Use PageContainer for:**
- Standard pages (Dashboard, Inventory, Settings)
- Pages with title + content
- Pages that need consistent spacing

**❌ Don't use PageContainer for:**
- Never - always use it unless you have a documented exception

### PageContainer Props Decision

| Scenario | Props |
|----------|-------|
| Standard page | `title`, `subtitle` |
| Page with button | `title`, `action` |
| Full-height page | `fullHeight`, `noPaddingTop` |
| Page with sticky search | `stickyTop` |

---

## Mobile-First Considerations

### Bottom Navigation Clearance

All pages MUST have bottom clearance on mobile to prevent overlap with MobileNav:

- Use PageContainer's automatic `pb-20` (80px) on mobile
- Or manually apply: `pb-20 md:pb-6`

### Responsive Breakpoints

```
Mobile:   < 768px (md breakpoint)
Desktop:  ≥ 768px
```

### Touch Optimization

- All interactive elements: min 44×44px
- Buttons in lists: Use `.touch-target`
- Category chips: min-h-11 (44px)

---

## Accessibility

### WCAG 2.1 Level AA Compliance

- **Touch targets:** ≥ 44×44px ✅
- **Color contrast:** 7:1+ (AAA) ✅
- **Semantic HTML:** Use proper heading hierarchy ✅
- **Focus states:** Visible focus rings ✅

### Focus States

All interactive elements automatically get focus rings via:
```css
* {
  @apply outline-ring/50;
}
```

---

## Common Mistakes to Avoid

### ❌ Don't
- Use inline padding instead of PageContainer
- Mix `rounded-[12px]` and `rounded-xl`
- Create custom page wrappers
- Forget bottom padding for mobile nav
- Use different title sizes across pages
- Create multiple search input implementations

### ✅ Do
- Always use PageContainer
- Use `rounded-xl` for all cards
- Follow the spacing scale
- Test on mobile viewport
- Reuse components (SearchInput, etc.)
- Document exceptions

---

## Testing Checklist

Before merging layout changes:

- [ ] No overlap with mobile navigation
- [ ] Consistent spacing on all pages
- [ ] Touch targets ≥ 44×44px
- [ ] Border radius uses `rounded-xl`
- [ ] Responsive design works (mobile + desktop)
- [ ] No TypeScript errors
- [ ] Build succeeds (`npm run build`)
- [ ] Visual inspection on multiple viewports

---

## Future Enhancements

Planned improvements:
- Offline support (Phase 2)
- Animation system documentation
- Component library (Storybook)
- Automated visual regression tests

---

## Questions?

Contact the design team or refer to:
- `docs/product/ui_ux.md` - UI/UX Guidelines
- `components/layouts/` - Layout components
- `app/globals.css` - Design tokens

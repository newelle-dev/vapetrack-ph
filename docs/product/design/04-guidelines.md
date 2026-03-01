# Interaction & Guidelines

## Interaction Patterns

### Touch Gestures

**Swipe Gestures:**
- **Swipe Left on Cart Item:** Reveal delete button
- **Swipe Down on Bottom Sheet:** Dismiss modal
- **Swipe Left/Right on Image Gallery:** Navigate product images (future)

**Long Press:**
- **Long Press on Product Card:** Quick actions menu (Edit, Delete, Duplicate)
- **Long Press on Quantity Stepper:** Fast increment/decrement (+10)

**Pull to Refresh:**
- **Pull Down on Dashboard:** Refresh data
- **Pull Down on Inventory List:** Reload products

---

### Loading & Feedback

**Optimistic UI:**
- **Add to Cart:** Immediate visual feedback, sync in background
- **Stock Adjustment:** Update UI instantly, rollback on error

**Loading States:**
- **Initial Load:** Full-screen skeleton loader
- **Infinite Scroll:** Spinner at bottom of list
- **Button Loading:** Spinner replaces button text, disable interaction

**Success Feedback:**
- **Sale Completed:** Green checkmark animation + haptic + toast
- **Product Added:** Toast notification "Product added successfully"

**Error Handling:**
- **API Error:** Red toast with error message + "Retry" button
- **Validation Error:** Inline error text below field, red border
- **Network Error:** Toast notification with retry option

---

### Navigation Patterns

**Tab Navigation (Owner):**
- Persistent bottom navigation (5 tabs)
- Active tab highlighted (primary color)
- Badge on tabs (e.g., notification count)

**Stack Navigation (Modals):**
- Bottom sheets for forms (Add Product, Checkout)
- Slide up from bottom, swipe down to dismiss
- Backdrop darkens background

**Breadcrumbs (Complex Flows):**
- "← Back" button top-left on detail pages
- Clear navigation hierarchy

---

## Accessibility Guidelines

### WCAG 2.1 Level AA Compliance

**Color Contrast:**
- **Text on Background:** Minimum 7:1 (AAA level for dark mode)
- **Large Text (18px+):** Minimum 4.5:1
- **Interactive Elements:** Minimum 3:1 contrast with adjacent colors

**Touch Targets:**
- **Minimum Size:** 44×44px (Apple), 48×48px (Android Material)
- **Spacing:** 8px minimum gap between interactive elements

**Focus States:**
- **Keyboard Navigation:** Visible focus ring (3px outline, primary color)
- **Focus Order:** Logical tab order (top to bottom, left to right)

**Screen Reader Support:**
- **ARIA Labels:** All icons have accessible labels
- **Semantic HTML:** Proper heading hierarchy (h1, h2, h3)
- **Alt Text:** All images have descriptive alt attributes

**Motion & Animations:**
- **Respect `prefers-reduced-motion`:** Disable animations if user prefers
- **Optional:** Toggle in settings to disable all animations

---

## Performance Considerations

### Mobile Optimization

**Image Optimization:**
- **Format:** WebP with JPEG fallback
- **Lazy Loading:** Intersection Observer for below-fold images
- **Responsive Images:** `srcset` for different screen densities (1x, 2x, 3x)
- **Size:** Max 200KB per product image, compressed

**Code Splitting:**
- **Route-based:** Load dashboard, POS, inventory separately
- **Component-based:** Lazy load charts, modals on demand

**Caching:**
- **Service Worker:** Cache static assets (CSS, JS, fonts)
- **API Caching:** Cache product list, refresh every 5 minutes
- **Local Storage:** Session persistence (cart state, auth tokens)

**Bundle Size:**
- **Target:** < 200KB gzipped for initial load
- **Tree Shaking:** Remove unused code from libraries
- **Font Loading:** Subset Google Fonts (Latin only), preload critical fonts

---

### Performance Budgets

| Metric | Target | Critical |
|--------|--------|----------|
| **First Contentful Paint (FCP)** | < 1.5s | < 2.5s |
| **Largest Contentful Paint (LCP)** | < 2.0s | < 3.0s |
| **Time to Interactive (TTI)** | < 3.0s | < 4.5s |
| **Cumulative Layout Shift (CLS)** | < 0.1 | < 0.25 |
| **First Input Delay (FID)** | < 100ms | < 300ms |

**Testing Conditions:**
- **Network:** 3G Fast (1.6 Mbps down, 750 Kbps up, 150ms RTT)
- **Device:** Mid-range Android (4GB RAM, Snapdragon 660)

---

## Responsive Breakpoints

```css
/* Mobile First - Default styles for 320px+ */

/* Small phones (landscape) */
@media (min-width: 480px) {
  /* Adjust font sizes, spacing slightly */
}

/* Tablets (portrait) */
@media (min-width: 768px) {
  /* 3-column product grid */
  /* Side-by-side layouts (cart + checkout) */
}

/* Tablets (landscape) / Small laptops */
@media (min-width: 1024px) {
  /* 4-column product grid */
  /* Sidebar navigation (replace bottom nav) */
  /* Split-screen POS (products left, cart right) */
}

/* Desktops */
@media (min-width: 1280px) {
  /* Max width container (1200px) */
  /* Multi-column dashboard */
}
```

**Breakpoint Variables:**
```css
--breakpoint-sm: 480px
--breakpoint-md: 768px
--breakpoint-lg: 1024px
--breakpoint-xl: 1280px
```

---

## Animation & Transitions

### Timing Functions

```css
--ease-out: cubic-bezier(0.33, 1, 0.68, 1);     /* Fast start, slow end */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);  /* Smooth both ends */
--bounce: cubic-bezier(0.68, -0.55, 0.27, 1.55); /* Subtle bounce */
```

### Common Animations

**Fade In:**
```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Slide Up:**
```css
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

**Scale Pulse (Add to Cart):**
```css
@keyframes scale-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

**Shake (Error):**
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}
```

---

## Icon System

**Recommended Icon Library:**
- **Lucide Icons:** Lightweight, consistent, React-friendly
- **Alternative:** Heroicons (Tailwind's official icons)

**Icon Sizes:**
```css
--icon-xs: 16px   /* Inline with text */
--icon-sm: 20px   /* Buttons, chips */
--icon-md: 24px   /* Default */
--icon-lg: 32px   /* Headers, emphasis */
--icon-xl: 48px   /* Empty states, heroes */
```

**Common Icons Needed:**
- **POS:** ShoppingCart, CreditCard, Banknote, Smartphone, CheckCircle
- **Inventory:** Package, Box, TrendingUp, TrendingDown, AlertTriangle
- **Navigation:** Home, BarChart3, Users, Settings, LogOut
- **Actions:** Plus, Minus, Trash2, Edit, Search, Filter, X
- **Status:** Check, AlertCircle, Info, ChevronRight, ChevronDown

---

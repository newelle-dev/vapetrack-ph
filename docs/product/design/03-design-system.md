# Design System

## Design System

### Color Palette

#### Dark Mode (Default)

**Surface Colors:**
```css
--surface-app: #0f172a        /* App background (Slate 950) */
--surface-card: #1e293b       /* Card backgrounds (Slate 800) */
--surface-elevated: #334155   /* Modals, dropdowns (Slate 700) */
--surface-hover: #475569      /* Hover states (Slate 600) */
```

**Primary (Brand):**
```css
--primary-50: #f0fdf4         /* Lightest tint */
--primary-100: #dcfce7
--primary-500: #22c55e        /* Main brand color (Green 500) */
--primary-600: #16a34a        /* Hover state */
--primary-700: #15803d        /* Active state */
--primary-900: #14532d        /* Darkest shade */
```

**Semantic Colors:**
```css
/* Success (Same as Primary) */
--success: #22c55e
--success-bg: #166534

/* Error / Low Stock Critical */
--error: #ef4444             /* Red 500 */
--error-bg: #7f1d1d          /* Red 950 */

/* Warning / Low Stock */
--warning: #f59e0b           /* Amber 500 */
--warning-bg: #78350f        /* Amber 950 */

/* Info */
--info: #3b82f6              /* Blue 500 */
--info-bg: #1e3a8a           /* Blue 950 */

/* Profit Green (Accent) */
--profit: #10b981            /* Emerald 500 */

/* Loss/Cost Red */
--loss: #f87171              /* Red 400 */
```

**Text Colors:**
```css
--text-primary: #f8fafc      /* White text (Slate 50) */
--text-secondary: #cbd5e1    /* Gray text (Slate 300) */
--text-muted: #94a3b8        /* Muted text (Slate 400) */
--text-disabled: #64748b     /* Disabled text (Slate 500) */
```

**Border Colors:**
```css
--border-default: #334155    /* Subtle borders (Slate 700) */
--border-strong: #475569     /* Emphasized borders (Slate 600) */
--border-interactive: #22c55e /* Interactive elements (Primary) */
```

---

### Typography

**Font Family:**
```css
/* Primary: Excellent readability on small screens */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Monospace (for SKUs, numbers): */
--font-mono: 'JetBrains Mono', 'Courier New', monospace;
```

**Google Fonts Import:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

**Font Sizes (Mobile-First):**
```css
--text-xs: 12px      /* Small labels, meta info */
--text-sm: 14px      /* Body text, descriptions */
--text-base: 16px    /* Default body text */
--text-lg: 18px      /* Section headers, emphasized text */
--text-xl: 20px      /* Page titles */
--text-2xl: 24px     /* Large numbers (stats) */
--text-3xl: 30px     /* Hero numbers (revenue) */
--text-4xl: 36px     /* Rare, major emphasis */
```

**Font Weights:**
```css
--font-normal: 400
--font-medium: 500   /* Subtle emphasis */
--font-semibold: 600 /* Buttons, labels */
--font-bold: 700     /* Numbers, prices */
--font-extrabold: 800 /* Hero text */
```

**Line Heights:**
```css
--leading-tight: 1.25   /* Headings */
--leading-normal: 1.5   /* Body text */
--leading-relaxed: 1.75 /* Long-form content */
```

---

### Spacing Scale (8px Base)

```css
--space-1: 4px      /* 0.25rem - Tight spacing */
--space-2: 8px      /* 0.5rem - Base unit */
--space-3: 12px     /* 0.75rem - Card gaps */
--space-4: 16px     /* 1rem - Standard padding */
--space-5: 20px     /* 1.25rem */
--space-6: 24px     /* 1.5rem - Section spacing */
--space-8: 32px     /* 2rem - Large gaps */
--space-10: 40px    /* 2.5rem */
--space-12: 48px    /* 3rem - Major sections */
--space-16: 64px    /* 4rem - Hero spacing */
```

**Component Padding:**
- **Cards:** 16px (--space-4)
- **Buttons:** 12px horizontal, 16px vertical (--space-3, --space-4)
- **Modals:** 24px (--space-6)
- **Page Edges:** 16px (--space-4)

---

### Border Radius

```css
--radius-sm: 6px     /* Small elements (badges, chips) */
--radius-md: 8px     /* Default (buttons, inputs) */
--radius-lg: 12px    /* Cards */
--radius-xl: 16px    /* Large modals, sheets */
--radius-2xl: 24px   /* Hero cards */
--radius-full: 9999px /* Pills, avatars */
```

---

### Shadows (Dark Mode Optimized)

```css
/* Subtle elevation for dark surfaces */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);

/* Cards */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4),
             0 2px 4px -1px rgba(0, 0, 0, 0.3);

/* Modals, floating buttons */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5),
             0 4px 6px -2px rgba(0, 0, 0, 0.3);

/* Emphasized (CTAs) */
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6),
             0 10px 10px -5px rgba(0, 0, 0, 0.4);

/* Colored shadows for primary buttons */
--shadow-primary: 0 8px 16px -4px rgba(34, 197, 94, 0.3);
```

---

### UI Components Library

#### 1. Buttons

**Primary Button (CTA):**
```css
.btn-primary {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-500));
  color: white;
  padding: 16px 24px;
  border-radius: var(--radius-md);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  box-shadow: var(--shadow-primary);
  
  /* Touch target */
  min-height: 56px;
  min-width: 56px;
  
  /* Interaction */
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--primary-700);
  box-shadow: var(--shadow-lg);
}

.btn-primary:active {
  transform: scale(0.98);
}
```

**Secondary Button (Outlined):**
```css
.btn-secondary {
  background: transparent;
  color: var(--primary-500);
  border: 2px solid var(--primary-500);
  padding: 14px 22px; /* Adjusted for border */
  border-radius: var(--radius-md);
  font-weight: var(--font-semibold);
  min-height: 56px;
}
```

**Danger Button:**
```css
.btn-danger {
  background: var(--error);
  color: white;
  /* Same structure as primary */
}
```

**Icon Button (Small):**
```css
.btn-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-elevated);
  color: var(--text-primary);
}
```

---

#### 2. Input Fields

**Text Input:**
```css
.input-text {
  background: var(--surface-elevated);
  color: var(--text-primary);
  border: 2px solid var(--border-default);
  padding: 14px 16px;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  min-height: 48px;
  width: 100%;
  
  /* Transition */
  transition: border-color 0.2s ease;
}

.input-text:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.input-text::placeholder {
  color: var(--text-muted);
}

.input-text.error {
  border-color: var(--error);
}
```

**Number Input (Stepper):**
```css
.input-stepper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.input-stepper button {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--surface-elevated);
  color: var(--text-primary);
  font-size: 20px;
  font-weight: bold;
}

.input-stepper input {
  width: 80px;
  text-align: center;
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  background: var(--surface-card);
  border: 2px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 12px;
}
```

---

#### 3. Cards

**Product Card (Grid):**
```css
.product-card {
  background: var(--surface-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.product-card:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-sm);
}

.product-card-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  background: var(--surface-elevated);
}

.product-card-content {
  padding: 12px;
}

.product-card-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  line-height: var(--leading-tight);
  
  /* Truncate to 2 lines */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-card-price {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--primary-500);
  margin-top: 4px;
}
```

**Stat Card (Dashboard):**
```css
.stat-card {
  background: var(--surface-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-card-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.stat-card-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

#### 4. Badges & Chips

**Badge (Notification Count):**
```css
.badge {
  background: var(--error);
  color: white;
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  padding: 2px 6px;
  border-radius: var(--radius-full);
  min-width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

**Category Chip (Filter):**
```css
.chip {
  background: var(--surface-elevated);
  color: var(--text-secondary);
  border: 2px solid var(--border-default);
  padding: 8px 16px;
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  white-space: nowrap;
  transition: all 0.2s ease;
}

.chip.active {
  background: var(--primary-600);
  color: white;
  border-color: var(--primary-600);
}
```

**Status Badge (Low Stock):**
```css
.badge-warning {
  background: var(--warning-bg);
  color: var(--warning);
  border: 1px solid var(--warning);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
}
```

---

#### 5. Bottom Sheet / Modal

**Bottom Sheet (Mobile):**
```css
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--surface-card);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  box-shadow: var(--shadow-xl);
  max-height: 85vh;
  overflow-y: auto;
  padding: 24px;
  z-index: 1000;
  
  /* Slide-up animation */
  transform: translateY(100%);
  transition: transform 0.3s ease-out;
}

.bottom-sheet.open {
  transform: translateY(0);
}

.bottom-sheet-handle {
  width: 40px;
  height: 4px;
  background: var(--border-strong);
  border-radius: var(--radius-full);
  margin: 0 auto 16px;
}
```

**Backdrop:**
```css
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  backdrop-filter: blur(2px);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.backdrop.visible {
  opacity: 1;
}
```

---

#### 6. Bottom Navigation (Owner)

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--surface-card);
  border-top: 1px solid var(--border-default);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 8px;
  z-index: 100;
}

.bottom-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  color: var(--text-muted);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  transition: color 0.2s ease;
  
  /* Touch target */
  min-width: 48px;
  min-height: 48px;
}

.bottom-nav-item.active {
  color: var(--primary-500);
}

.bottom-nav-item svg {
  width: 24px;
  height: 24px;
}
```

---

#### 7. Floating Action Button (FAB)

```css
.fab {
  position: fixed;
  bottom: 80px; /* Above bottom nav */
  right: 16px;
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--primary-600), var(--primary-500));
  color: white;
  box-shadow: var(--shadow-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  z-index: 50;
  transition: all 0.2s ease;
}

.fab:active {
  transform: scale(0.95);
}
```

---

#### 8. Toast Notifications

```css
.toast {
  position: fixed;
  bottom: 80px;
  left: 16px;
  right: 16px;
  background: var(--surface-elevated);
  color: var(--text-primary);
  padding: 16px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: var(--text-sm);
  z-index: 1001;
  
  /* Slide-up animation */
  animation: toast-slide-up 0.3s ease-out;
}

@keyframes toast-slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.toast.success {
  border-left: 4px solid var(--success);
}

.toast.error {
  border-left: 4px solid var(--error);
}

.toast.warning {
  border-left: 4px solid var(--warning);
}
```

---

#### 9. Loading States

**Spinner:**
```css
.spinner {
  border: 3px solid var(--surface-elevated);
  border-top-color: var(--primary-500);
  border-radius: var(--radius-full);
  width: 24px;
  height: 24px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Skeleton Loader (Product Card):**
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface-card) 0%,
    var(--surface-elevated) 50%,
    var(--surface-card) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

#### 10. Empty States

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-state-icon {
  font-size: 64px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.empty-state-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: 8px;
}

.empty-state-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: 24px;
}
```

---

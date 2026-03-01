# Wireframe Descriptions

## Wireframe Descriptions

### 1. POS Screen (Staff Primary View)
**Device:** Mobile (375×812px reference - iPhone X/11/12/13 Mini size)  
**Orientation:** Portrait (Primary), Landscape (Optional)

#### Layout Structure

```
┌─────────────────────────────────────┐
│  ☰  VapeTrack PH        [Cart: 3] 🛒│ ← Header (60px)
├─────────────────────────────────────┤
│  🔍 Search products...              │ ← Search Bar (56px)
├─────────────────────────────────────┤
│  [Juice] [Devices] [Pods] [Cotton] │ ← Category Chips (48px, horizontal scroll)
├─────────────────────────────────────┤
│                                     │
│  ┌────────┐  ┌────────┐            │
│  │ [IMG]  │  │ [IMG]  │            │ ← Product Grid
│  │ Mango  │  │ Mint   │            │   (2 columns, gap: 12px)
│  │ Juice  │  │ Juice  │            │
│  │ ₱450   │  │ ₱450   │            │   Card Size: 
│  └────────┘  └────────┘            │   164×200px
│                                     │
│  ┌────────┐  ┌────────┐            │
│  │ [IMG]  │  │ [IMG]  │            │
│  │ Vape   │  │ Cotton │            │
│  │ Device │  │ Bacon  │            │
│  │ ₱2,500 │  │ ₱150   │            │
│  └────────┘  └────────┘            │
│                                     │
│  [Load More...]                     │
│                                     │
│                                     │ ← Scrollable Area
│                                     │
│                                     │
└─────────────────────────────────────┘
│         [💰 Checkout (3)]          │ ← Floating Action Button (64px)
└─────────────────────────────────────┘
```

#### Component Details

**Header Bar (Sticky)**
- **Height:** 60px
- **Background:** `surface-dark` (#1f2937)
- **Left:** Hamburger menu (44×44px) → Drawer: Profile, Logout
- **Center:** "VapeTrack PH" logo/text (16px, semibold)
- **Right:** Cart badge (44×44px) with item count bubble

**Search Bar**
- **Height:** 56px
- **Padding:** 16px horizontal
- **Icon:** Magnifying glass (20px) left-aligned
- **Placeholder:** "Search products..." (14px, gray-400)
- **Behavior:** Focus → expand to full width, show recent searches

**Category Chips (Horizontal Scroll)**
- **Height:** 48px (including 8px top/bottom padding)
- **Chip Size:** Auto-width, 36px height, 16px padding
- **Style:** Outlined (inactive), filled primary (active)
- **Behavior:** Tap to filter products by category

**Product Cards (Grid)**
- **Layout:** 2 columns, 12px gap
- **Card Size:** 164×200px
- **Structure:**
  - Product Image (164×120px, aspect 4:3, lazy load)
  - Product Name (14px, semibold, 2-line truncate)
  - Price (18px, bold, primary color)
  - Stock Indicator (Future): Small badge if low stock
- **Interaction:** Tap card → Variant selector OR Add to cart

**Floating Checkout Button**
- **Position:** Fixed bottom, 16px from edges
- **Size:** Full-width minus 32px (343×64px on 375px screen)
- **Style:** Large, rounded (16px radius), primary green gradient
- **Text:** "💰 Checkout (3)" — 18px, bold, white
- **Behavior:** 
  - Tap → Slide up cart sheet
  - Badge shows item count
  - Pulse animation when item added

---

### 2. Variant Selector Modal (Appears after tapping product with variants)

```
┌─────────────────────────────────────┐
│                 ╳                   │ ← Drag Handle + Close
├─────────────────────────────────────┤
│  [Product Image - 120px height]     │
│                                     │
│  Premium Vape Juice - Mango         │ ← Product Name (18px, bold)
│  ₱450 • In Stock: 23 bottles        │ ← Meta Info (14px, gray)
├─────────────────────────────────────┤
│  Select Nicotine Level:             │ ← Section Label (14px, gray-400)
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ 0mg │ │ 3mg │ │ 6mg │ │12mg │  │ ← Variant Chips (Grid)
│  └─────┘ └─────┘ └─────┘ └─────┘  │   Each: 72×56px
│           [SELECTED - Primary]      │
│                                     │
├─────────────────────────────────────┤
│  Quantity:                          │
│                                     │
│  ┌───┐  ┌─────┐  ┌───┐             │
│  │ - │  │  1  │  │ + │             │ ← Quantity Stepper
│  └───┘  └─────┘  └───┘             │   Each button: 56×56px
│   (48×48px touch target)            │
│                                     │
├─────────────────────────────────────┤
│  Subtotal: ₱450                     │ ← Price Preview (16px)
│                                     │
│  [ Add to Cart ]                    │ ← CTA Button (Full-width, 56px)
└─────────────────────────────────────┘
```

#### Interaction Details

**Sheet Behavior:**
- Slides up from bottom (iOS-style modal)
- Semi-transparent backdrop (black, 40% opacity)
- Swipe down to dismiss OR tap outside OR tap ✕

**Variant Selection:**
- **Layout:** Horizontal chips if ≤ 4 variants, Grid if > 4
- **Active State:** Primary color fill, white text, subtle shadow
- **Inactive State:** Outlined, gray text
- **Out of Stock:** Grayed out, strikethrough, disabled

**Quantity Stepper:**
- **Default:** 1
- **Min:** 1
- **Max:** Current stock quantity
- **Increment:** +1 per tap
- **Long Press (Future):** +5 or +10

**Add to Cart Button:**
- **State:** Disabled if variant not selected
- **Haptic:** Light vibration on tap
- **Animation:** Checkmark bounce, then dismiss modal

---

### 3. Checkout Cart Sheet

```
┌─────────────────────────────────────┐
│           Your Cart (3)         ╳   │ ← Header
├─────────────────────────────────────┤
│                                     │
│  ┌─ Mango Juice (3mg) ──────────┐  │
│  │ Qty: 2    ₱450 × 2 = ₱900   │  │ ← Line Item
│  │                     [−] [+] │  │   (Swipe left to delete)
│  └─────────────────────────────┘  │
│                                     │
│  ┌─ Cotton Bacon ───────────────┐  │
│  │ Qty: 1    ₱150 × 1 = ₱150   │  │
│  └─────────────────────────────┘  │
│                                     │
│  ┌─ Vape Device (Black) ────────┐  │
│  │ Qty: 1    ₱2,500 × 1 = ₱2,500│  │
│  └─────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│  Subtotal:              ₱3,550      │ ← Summary (Bold, 18px)
│                                     │
├─────────────────────────────────────┤
│  Payment Method:                    │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ 💵  │ │ 📱  │ │ 💳  │           │ ← Payment Buttons
│  │Cash │ │GCash│ │Card │           │   Each: 96×80px
│  └─────┘ └─────┘ └─────┘           │   (Active: Primary fill)
│   [SELECTED]                        │
│                                     │
├─────────────────────────────────────┤
│  Customer Name (Optional)           │
│  [________________________]         │ ← Text Input (48px)
│                                     │
├─────────────────────────────────────┤
│  [ Complete Sale - ₱3,550 ]         │ ← Final CTA (64px, Green)
└─────────────────────────────────────┘
```

#### Interaction Details

**Line Items:**
- **Layout:** List, 8px gap
- **Actions:** 
  - Tap quantity stepper to adjust
  - Swipe left → Delete icon appears
  - Tap delete → Confirm toast

**Payment Method:**
- **Layout:** Horizontal grid, 3 columns
- **Icons:** Emoji + label (14px)
- **Selection:** Single-choice, primary fill on active
- **Default:** Last-used method OR Cash

**Complete Sale Button:**
- **State:** Disabled if cart empty OR payment method not selected
- **Loading:** Spinner animation during API call
- **Success:** Navigate to success screen

---

### 4. Dashboard (Owner View)
**Goal:** At-a-glance business health, above the fold on mobile

```
┌─────────────────────────────────────┐
│  ☰  Dashboard          🔔 [3]      │ ← Header (Notification badge)
├─────────────────────────────────────┤
│  Good morning, Juan! ☀️             │ ← Personalized Greeting (18px)
│  Branch: Manila (Main) ▼            │ ← Branch Selector (Tap to switch)
├─────────────────────────────────────┤
│  TODAY'S SALES                      │ ← Section Header (12px, gray-400, uppercase)
│                                     │
│  ┌───────────────────────────────┐ │
│  │  ₱12,450                      │ │ ← Sales Card (Large)
│  │  Total Revenue                │ │   BG: Gradient (Green)
│  │                               │ │   Height: 120px
│  │  📈 +15% vs yesterday         │ │   Profit shown for owners only
│  │  Profit: ₱4,230 (34%)         │ │
│  └───────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│  QUICK STATS                        │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │ 42       │  │ ₱296     │        │ ← Stat Cards (2 cols)
│  │ Sales    │  │ Avg Sale │        │   Each: ~164×100px
│  └──────────┘  └──────────┘        │
│                                     │
├─────────────────────────────────────┤
│  ⚠️ LOW STOCK ALERTS (3)            │ ← Alert Section (Yellow accent)
│                                     │
│  • Mango Juice (3mg) - 5 left      │
│  • Cotton Bacon - 3 left           │ ← Tappable list items
│  • Pod System - 8 left             │   (→ Navigate to product)
│                                     │
│  [View All Low Stock →]            │
│                                     │
├─────────────────────────────────────┤
│  🔥 TOP SELLERS (This Week)         │
│                                     │
│  1. Mango Juice (3mg)    45 sold   │
│  2. Vape Device (Black)  12 sold   │ ← Numbered list
│  3. Cotton Bacon         38 sold   │   (Product name + quantity)
│                                     │
├─────────────────────────────────────┤
│  📝 RECENT ACTIVITY                 │
│                                     │
│  • Maria sold ₱450 - 2m ago        │
│  • Juan restocked Mint Juice - 1h  │ ← Activity feed
│  • New staff added: Pedro - 3h    │   (Icon + text + time)
│                                     │
│  [View All Activity →]             │
│                                     │
└─────────────────────────────────────┘
│  [Dashboard] [POS] [Inv] [Rpt] [⚙️] │ ← Bottom Navigation (60px)
└─────────────────────────────────────┘
```

#### Component Details

**Branch Selector:**
- **Style:** Pill button, outlined, dropdown icon
- **Interaction:** Tap → Modal with branch list (large touch targets)
- **Effect:** Filters all dashboard data by selected branch

**Sales Card (Hero):**
- **Height:** 120px
- **Background:** Gradient (green-500 to green-600)
- **Layout:** Vertical stack
  - Revenue (32px, bold, white)
  - Label (14px, white 80% opacity)
  - Trend indicator (14px, icon + text)
  - Profit (16px, only for owners)

**Quick Stats Grid:**
- **Layout:** 2 columns, 12px gap
- **Card Height:** 100px
- **Style:** Dark surface, rounded (12px), subtle border
- **Content:** Number (24px, bold) + Label (12px, gray)

**Low Stock Alerts:**
- **Header:** Yellow warning icon, item count badge
- **List:** Max 3 items shown, "View All" expands
- **Item Style:** Bullet + product name + stock count (red text)
- **Interaction:** Tap item → Navigate to product detail

**Top Sellers:**
- **List:** Numbered, max 3 shown
- **Style:** Rank number (bold, primary) + name + count (gray)

**Recent Activity Feed:**
- **List:** Icon + text + relative time
- **Icons:** Contextual (💰 sale, 📦 restock, 👤 user action)
- **Limit:** 3 items, "View All" for full feed

---

### 5. Product Form (Add/Edit Product)
**Challenge:** Handle variants efficiently on mobile

```
┌─────────────────────────────────────┐
│  ← Back    Add Product       Save  │ ← Header
├─────────────────────────────────────┤
│                                     │
│  [📷 Upload Image]                  │ ← Image Upload (120×120px, centered)
│  Tap to add photo                   │
│                                     │
├─────────────────────────────────────┤
│  Product Information                │ ← Section (Accordion-style)
│                                     │
│  Product Name *                     │
│  [_____________________________]    │ ← Text Input (48px height)
│                                     │
│  Category                           │
│  [Select category ▼___________]    │ ← Dropdown (48px)
│                                     │
│  Brand                              │
│  [_____________________________]    │
│                                     │
│  Description                        │
│  [_____________________________]    │ ← Textarea (96px)
│  [_____________________________]    │
│                                     │
├─────────────────────────────────────┤
│  Variants                           │
│                                     │
│  ○ Single Product (No Variants)     │ ← Radio Options
│  ● Has Variants (e.g., 3mg, 6mg)    │   (Large touch targets)
│                                     │
│  ┌─ Variant 1 ──────────────────┐  │
│  │ Variant Name: [3mg_______]   │  │ ← Variant Card
│  │ SKU: [PVJ-MANGO-3MG______]   │  │   (Collapsible)
│  │ Selling Price: [₱ 450____]   │  │
│  │ Capital Cost: [₱ 320_____]   │  │
│  │ Initial Stock: [10_______]   │  │
│  │               [− Remove]     │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌─ Variant 2 ──────────────────┐  │
│  │ Variant Name: [6mg_______]   │  │
│  │ ... (collapsed)              │  │
│  └──────────────────────────────┘  │
│                                     │
│  [+ Add Another Variant]            │ ← Button (Outlined, 48px)
│                                     │
├─────────────────────────────────────┤
│  Stock Alert Settings               │
│                                     │
│  Low Stock Threshold                │
│  ┌───┐  ┌─────┐  ┌───┐             │
│  │ - │  │ 10  │  │ + │             │ ← Number Stepper
│  └───┘  └─────┘  └───┘             │
│                                     │
├─────────────────────────────────────┤
│  [ Save Product ]                   │ ← CTA (Full-width, 56px, Green)
└─────────────────────────────────────┘
```

#### Interaction Details

**Variant Toggle:**
- **Single Product:** Creates ONE variant named "Standard" (hidden from user)
- **Has Variants:** Shows variant form fields

**Variant Management:**
- **Add Variant:** Expands new card with empty fields
- **Remove Variant:** Requires confirmation if stock exists
- **Collapse/Expand:** Tap header to toggle card visibility

**Smart Defaults:**
- **SKU:** Auto-generated from Product Name + Variant Name (editable)
- **Stock:** Default 0, can set later
- **Capital Cost:** Optional at creation, required for profit tracking

**Validation:**
- **Required Fields:** Product name, variant name, selling price
- **Price Validation:** Selling price ≥ capital cost (warning if not)
- **Inline Errors:** Red text below field, prevents save

---

### 6. Inventory List (Owner)

```
┌─────────────────────────────────────┐
│  ← Back    Inventory       [+]     │ ← Header (+ to add product)
├─────────────────────────────────────┤
│  🔍 Search by name or SKU...        │ ← Search Bar
│                                     │
│  [All] [Juice] [Devices] [Pods]    │ ← Filter Chips (Horizontal scroll)
│                                     │
│  Branch: Manila ▼  |  Sort: A-Z ▼  │ ← Filters (2 cols)
├─────────────────────────────────────┤
│  PRODUCTS (47)                      │ ← Section Header
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [IMG] Premium Vape Juice - Man...││ ← Product Row (Expandable)
│  │       Juice • Brand XYZ        ││   Tap to expand variants
│  │       4 variants • 38 in stock ││
│  │                            [>] ││
│  └─────────────────────────────────┘│
│    ↓ EXPANDED STATE:                │
│  ┌─────────────────────────────────┐│
│  │ [IMG] Premium Vape Juice - Man...││
│  │                                 ││
│  │ ├─ 0mg  (SKU: ...3MG) ─────────┤││
│  │ │  Stock: 10  |  ₱450  [Edit] │││ ← Variant Rows
│  │ └────────────────────────────────┘│   (Scrollable if many)
│  │ ├─ 3mg  (SKU: ...3MG) ─────────┤││
│  │ │  Stock: 5   |  ₱450  [Edit] │││   Stock shown if owner
│  │ └────────────────────────────────┘│
│  │ ├─ 6mg  (SKU: ...6MG) ─────────┤││
│  │ │  Stock: 8   |  ₱450  [Edit] │││
│  │ └────────────────────────────────┘│
│  │ ├─ 12mg (SKU: ...12MG) ────────┤││
│  │ │  Stock: 15  |  ₱500  [Edit] │││
│  │ └────────────────────────────────┘│
│  │                            [^] ││ ← Collapse
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [IMG] Cotton Bacon             ││
│  │       Cotton • Brand ABC       ││
│  │       1 variant • 23 in stock  ││
│  │                            [>] ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [IMG] Vape Device Pro          ││
│  │       Device • Brand XYZ  ⚠️ LOW││ ← Low Stock Badge
│  │       3 variants • 8 in stock  ││
│  │                            [>] ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

#### Component Details

**Product Row (Collapsed):**
- **Height:** 80px
- **Layout:** Horizontal flex
  - Image (60×60px, rounded)
  - Text Stack (Product name, meta info)
  - Expand chevron (24×24px)
- **Meta Info:** Category • Brand • Variant count • Total stock
- **Badge:** Low stock warning (yellow/red)

**Variant Rows (Expanded):**
- **Indented:** 16px left padding, nested appearance
- **Layout:** SKU + Stock count + Price + Edit button (icon)
- **Edit Action:** Navigate to edit variant sheet

**Stock Visibility:**
- **Owner:** See all stock levels and prices
- **Staff:** No access to inventory list (read-only lookup only)

---

### 7. Staff PIN Login

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│         VapeTrack PH 🌿             │ ← Logo (Centered, 48px)
│                                     │
│                                     │
│      Enter Your PIN                 │ ← Instruction (18px, gray)
│                                     │
│      ●  ●  ●  ●  ○  ○              │ ← PIN Dots (4 filled, 2 empty)
│                                     │   Shows 4-6 digit progress
│                                     │
│                                     │
│   ┌───────────────────────┐        │
│   │  1     2     3        │        │
│   │                       │        │ ← Numeric Keypad
│   │  4     5     6        │        │   Each button: 96×96px
│   │                       │        │   Large, touch-optimized
│   │  7     8     9        │        │
│   │                       │        │
│   │  ←     0     ✓        │        │   ← = Backspace
│   └───────────────────────┘        │   ✓ = Submit (if 4-6 digits)
│                                     │
│                                     │
│   Forgot PIN? Contact Admin         │ ← Help Text (14px, link)
│                                     │
│                                     │
└─────────────────────────────────────┘
```

#### Interaction Details

**PIN Entry:**
- **Auto-Submit:** When 4-6 digits entered, validates immediately
- **Backspace:** Clear last digit
- **Submit (✓):** Only enabled when PIN length valid
- **Success:** Immediate redirect to branch selection OR POS
- **Error:** Shake animation, clear PIN, red flash on dots

**Security:**
- **Rate Limiting:** 3 failed attempts → 30-second lockout
- **Lockout Screen:** Timer countdown, "Try again in XX seconds"
- **No Hints:** Don't reveal PIN length on error

---

### 8. Reports Screen (Owner)

```
┌─────────────────────────────────────┐
│  ← Back    Reports                  │
├─────────────────────────────────────┤
│  📅 Date Range                      │
│                                     │
│  [Today ▼]                          │ ← Preset Dropdown (48px)
│     • Today                         │   Options: Today, Yesterday,
│     • Yesterday                     │   This Week, Last Week,
│     • This Week                     │   This Month, Last Month,
│     • Last Week                     │   This Year, Custom
│     • This Month                    │
│     • Custom...                     │
│                                     │
│  Branch: [All Branches ▼]          │
├─────────────────────────────────────┤
│  SALES SUMMARY                      │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Total Revenue       ₱125,430   │││
│  │ Total Capital Cost   ₱82,150   │││ ← Summary Cards
│  │ Gross Profit         ₱43,280   │││   (Stacked, 60px each)
│  │ Profit Margin          34.4%   │││
│  └─────────────────────────────────┘│
│                                     │
├─────────────────────────────────────┤
│  📊 SALES CHART                     │
│                                     │
│  [Chart visualization here]         │ ← Line/Bar Chart (200px height)
│   Revenue over time                 │   Future: react-charts or recharts
│                                     │
├─────────────────────────────────────┤
│  🔥 TOP PRODUCTS                    │
│                                     │
│  1. Mango Juice (3mg)               │
│     145 sold • ₱65,250 revenue     │ ← Ranked list with metrics
│                                     │
│  2. Vape Device Pro (Black)         │
│     38 sold • ₱95,000 revenue      │
│                                     │
│  3. Cotton Bacon                    │
│     92 sold • ₱13,800 revenue      │
│                                     │
│  [View Full Report →]              │
│                                     │
├─────────────────────────────────────┤
│  👥 STAFF PERFORMANCE               │
│                                     │
│  Maria Santos                       │
│  52 sales • ₱42,300 revenue        │
│                                     │
│  Juan Dela Cruz                     │
│  38 sales • ₱31,200 revenue        │
│                                     │
│  [View Detailed Breakdown →]       │
│                                     │
├─────────────────────────────────────┤
│  [ 📥 Export Report (CSV) ]         │ ← Export Button (Full-width, 56px)
└─────────────────────────────────────┘
```

#### Component Details

**Date Range Picker:**
- **Presets:** Common ranges (Today, This Week, etc.)
- **Custom:** Opens calendar modal (date range selector)
- **Default:** Today

**Summary Cards:**
- **Layout:** Stacked vertically, 60px each
- **Style:** Dark surface, left-aligned label, right-aligned value
- **Emphasis:** Profit values in green/red based on positive/negative

**Charts (Future):**
- **Library:** Chart.js or Recharts (React-friendly)
- **Type:** Line chart for trends, Bar chart for comparisons
- **Responsive:** Touch-enabled, zoomable on mobile

**Export:**
- **Format:** CSV (Excel-compatible)
- **Content:** Full dataset for selected date range
- **Behavior:** Download file OR email (future)

---

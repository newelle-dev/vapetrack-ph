# Core Principles & Flows

## Design Principles

### 1. Speed-First Design
**Primary Goal:** Enable staff to complete a sale in under 30 seconds with one hand.

- **One-Tap Actions:** Most common operations require a single tap
- **Predictive UI:** Anticipate next action based on context
- **Minimal Input:** Reduce typing; use steppers, presets, and quick-select
- **Instant Feedback:** Visual confirmation for every action (haptic feedback where supported)

### 2. Mobile-First, Touch-Optimized
**Target Device:** Android smartphones (5.5" - 6.7" screens)

- **44×44px Minimum Touch Targets:** All interactive elements meet this standard
- **Thumb Zone Optimization:** Critical actions placed within natural thumb reach
- **One-Handed Operation:** Primary navigation and actions accessible with thumb
- **Landscape Support:** Optional for tablet users

### 3. Dark Mode as Default
**Context:** Vape shops often have ambient lighting; reduce eye strain.

- **High Contrast:** Ensure WCAG AAA contrast ratios (7:1+)
- **Dim Surfaces:** Use dark grays, not pure black (reduces OLED burn-in)
- **Color Coding:** Use semantic colors for quick recognition (red = low stock, green = profit)

### 4. Contextual Simplicity
**User Technical Literacy:** Basic to moderate

- **Role-Based UI:** Staff see only what they need (no profit margins, no analytics)
- **Progressive Disclosure:** Advanced features hidden until needed
- **Visual Hierarchy:** Large typography for key info (prices, stock counts)
- **Icon + Label:** Never rely on icons alone

### 5. Network-Aware Design (Future Enhancement)
**Network Reality:** Philippine internet can be unreliable

_Note: Offline capabilities planned for Phase 2_

- **Optimistic UI:** Assume success, sync in background
- **Clear Error Handling:** Informative messages when requests fail
- **Network Status Indicators:** Visual feedback for connection issues

---

## High-Level Site Map

### 🏪 Shop Owner Navigation Structure

```
VapeTrack PH (Owner)
│
├── 📊 Dashboard (Home)
│   ├── Today's Sales Summary
│   ├── Quick Stats (Revenue, Profit, Transactions)
│   ├── Low Stock Alerts
│   ├── Top Sellers (This Week)
│   └── Recent Activity Feed
│
├── 💰 POS (Point of Sale)
│   ├── Product Search/Browse
│   ├── Cart Management
│   ├── Checkout Flow
│   └── Transaction History
│
├── 📦 Inventory
│   ├── Product List (Search, Filter by Category/Branch)
│   ├── Add/Edit Product
│   │   ├── Product Details
│   │   └── Variant Management (SKU, Price, Cost, Stock)
│   ├── Stock Adjustment
│   ├── Low Stock Alerts
│   └── Inventory Reports
│
├── 🏢 Branches
│   ├── Branch List
│   ├── Add/Edit Branch
│   └── Branch Performance Comparison
│
├── 👥 Staff Management
│   ├── Staff List
│   ├── Add/Edit Staff (PIN Setup)
│   ├── Staff Performance Reports
│   └── Activity Logs (Audit Trail)
│
├── 📈 Reports & Analytics
│   ├── Sales Reports (Daily/Weekly/Monthly/Yearly)
│   ├── Profit Analysis
│   ├── Product Performance
│   ├── Staff Performance
│   └── Export Data (CSV/Excel)
│
├── ⚙️ Settings
│   ├── Shop Profile
│   ├── Subscription & Billing
│   ├── Preferences (Low Stock Thresholds, Notifications)
│   └── Account Settings (Password, Security)
│
└── 🔐 Authentication
    ├── Owner Login (Email/Password)
    └── Logout
```

### 👤 Staff Navigation Structure (Simplified)

```
VapeTrack PH (Staff)
│
├── 🔐 PIN Login
│   └── Branch Selection
│
├── 💰 POS (Point of Sale) — PRIMARY SCREEN
│   ├── Product Search/Browse
│   ├── Cart Management
│   └── Checkout Flow
│
├── 📦 Quick Inventory Lookup (Read-Only)
│   └── Check Stock Levels
│
└── 👤 Profile
    ├── View My Sales Today
    └── Logout
```

**Navigation Pattern:**
- **Owner:** Bottom Navigation (5 tabs: Dashboard, POS, Inventory, Reports, Settings)
- **Staff:** Floating Action Button (FAB) for primary actions (POS, Quick Inventory), with hidden bottom nav to maximize screen real estate.

---

## Core User Flows

### 1. The "Speed Sale" Flow (Staff)
**Target Time:** < 30 seconds from login to receipt

```mermaid
graph TD
    A[Staff Opens App] --> B{Already Logged In?}
    B -->|No| C[PIN Login Screen]
    B -->|Yes| D[POS Screen]
    C --> E[Enter 4-6 Digit PIN]
    E --> F{PIN Valid?}
    F -->|No| G[Shake Animation + Error]
    G --> E
    F -->|Yes| H{Multiple Branches?}
    H -->|Yes| I[Select Branch - Large Touch Targets]
    H -->|No| D
    I --> D
    
    D --> J[Search/Browse Products]
    J --> K[Tap Product Card]
    K --> L{Has Variants?}
    L -->|Yes| M[Quick Variant Selector - Chips/Grid]
    L -->|No| N[Add to Cart - Quantity Stepper]
    M --> N
    
    N --> O{Continue Shopping?}
    O -->|Yes| J
    O -->|No| P[Cart Badge Shows Count]
    
    P --> Q[Tap Floating Checkout Button]
    Q --> R[Checkout Sheet Slides Up]
    R --> S[Payment Method - Large Buttons: Cash/GCash/Card]
    S --> T[Confirm Sale - Large Green Button]
    T --> U[Inventory Updates Immediately]
    U --> V[Success Screen - Checkmark Animation]
    V --> W[Auto-Dismiss After 2s OR Tap to Continue]
    W --> D
    
    style D fill:#4ade80,stroke:#22c55e,stroke-width:3px
    style T fill:#22c55e,stroke:#16a34a,stroke-width:3px
    style V fill:#10b981,stroke:#059669,stroke-width:2px
```

**Key Optimization Points:**
- **Persistent Login:** Staff stays logged in for 8 hours (configurable)
- **No Page Reload:** SPA navigation, instant transitions
- **Predictive Search:** Search starts on first keystroke, debounced 200ms
- **Smart Defaults:** Last-used payment method pre-selected
- **Haptic Feedback:** Tactile confirmation on add-to-cart, checkout

---

### 2. The "Restock" Flow (Owner)
**Target Time:** < 45 seconds per product

```mermaid
graph TD
    A[Owner on Dashboard] --> B[Tap Low Stock Alert Badge]
    B --> C[Low Stock List - Sorted by Urgency]
    C --> D[Tap Product to Restock]
    
    D --> E[Product Detail Sheet Slides Up]
    E --> F{Multiple Variants?}
    F -->|Yes| G[Tab Navigation: Variants]
    F -->|No| H[Stock Adjustment Section]
    G --> I[Select Variant to Restock]
    I --> H
    
    H --> J[Current Stock Shown Prominently]
    J --> K[Tap 'Adjust Stock' Button]
    K --> L[Stock Adjustment Modal]
    
    L --> M[Select Branch - Dropdown/Chips]
    M --> N[Adjustment Type: Stock In/Out/Transfer]
    N --> O[Quantity Stepper OR Number Input]
    O --> P[Update Capital Cost - Optional]
    P --> Q[Add Notes - Optional]
    
    Q --> R[Preview: Before → After Quantity]
    R --> S[Confirm Adjustment - Green Button]
    S --> T[Stock Updated + Logged in Stock Movements]
    T --> U[Success Toast - Returns to List]
    U --> C
    
    style C fill:#fbbf24,stroke:#f59e0b,stroke-width:2px
    style S fill:#22c55e,stroke:#16a34a,stroke-width:3px
    style T fill:#10b981,stroke:#059669,stroke-width:2px
```

**Key Optimization Points:**
- **Smart Sorting:** Lowest stock first, then by sales velocity
- **Bulk Actions:** Future: Select multiple products, apply same adjustment
- **Barcode Support (Future):** Scan to find product instantly
- **Autosave Capital Cost:** Remember last-entered cost for each supplier

---

### 3. First-Time Setup Flow (Owner)
**Onboarding Goal:** Get first sale completed within 15 minutes

```mermaid
graph TD
    A[Sign Up - Email/Password] --> B[Email Verification]
    B --> C[Create Organization - Shop Name]
    C --> D[Welcome Screen - 3-Step Setup]
    
    D --> E[Step 1: Create First Branch]
    E --> F[Branch Name + Location - Optional Address]
    F --> G[Step 2: Add First Product]
    
    G --> H[Product Name + Category]
    H --> I{Has Variants?}
    I -->|Yes| J[Add Variants - Quick Form]
    I -->|No| K[Single Variant - Standard]
    J --> L[Set Prices - Selling Price + Capital Cost]
    K --> L
    L --> M[Set Initial Stock - Number Input]
    
    M --> N[Step 3: Add First Staff - Optional]
    N --> O{Add Staff Now?}
    O -->|Yes| P[Staff Name + 4-Digit PIN]
    O -->|No| Q[Skip for Now]
    P --> Q
    
    Q --> R[Setup Complete - Celebration Animation]
    R --> S[Tutorial Overlay: Try Your First Sale]
    S --> T[Dashboard - Ready to Use]
    
    style D fill:#3b82f6,stroke:#2563eb,stroke-width:2px
    style R fill:#22c55e,stroke:#16a34a,stroke-width:3px
    style T fill:#4ade80,stroke:#22c55e,stroke-width:2px
```

**Key Optimization Points:**
- **Minimal Required Fields:** Name only; address optional
- **Inline Validation:** Real-time feedback on errors
- **Progress Indicator:** Clear "Step 1 of 3" visual
- **Skip Options:** Can skip staff creation, add later
- **Sample Data:** Offer to pre-populate with demo products

---

### 4. Staff PIN Login Flow
**Target Time:** < 5 seconds

```mermaid
graph TD
    A[App Opened] --> B{Session Valid?}
    B -->|Yes| C[Redirect to POS]
    B -->|No| D[PIN Entry Screen]
    
    D --> E[Large Numeric Keypad - 0-9]
    E --> F[PIN Dots Fill as Typed]
    F --> G{PIN Length OK?}
    G -->|< 4 digits| E
    G -->|4-6 digits| H[Auto-Submit on Last Digit]
    
    H --> I{PIN Valid?}
    I -->|No| J[Shake Animation + Clear PIN]
    J --> K{Attempts > 3?}
    K -->|Yes| L[Lockout for 30 seconds]
    K -->|No| E
    L --> M[Show Timer + Try Again Message]
    M --> E
    
    I -->|Yes| N{Multiple Branches?}
    N -->|No| O[Set Default Branch]
    N -->|Yes| P[Branch Selection - Grid Layout]
    P --> Q[Tap Branch Card]
    Q --> O
    
    O --> R[Remember Selection for Session]
    R --> C
    
    style D fill:#3b82f6,stroke:#2563eb,stroke-width:2px
    style H fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px
    style C fill:#22c55e,stroke:#16a34a,stroke-width:3px
```

**Key Optimization Points:**
- **Auto-Submit:** No "Enter" button needed
- **Biometric Future:** Face unlock on supported devices
- **Remember Branch:** Default to last-selected branch


### Staff Navigation (FAB Pattern)

Instead of the standard bottom navigation bar, staff users get a simplified interface focused on speed:

**Quick Actions FAB (Floating Action Button)**
- **Position:** Fixed bottom-right (24px from edges)
- **Primary Action (POS):** Large circular button (64px), shadow-xl
- **Secondary Action (Inventory):** Smaller circular button (56px) above POS button
- **Behavior:** Always visible on non-POS pages.

**Why this pattern?**
- Maximizes screen real estate for data entry
- Reduces cognitive load (fewer navigation choices)
- Explicit "Speed-First" optimization for the most common task (opening POS)

---

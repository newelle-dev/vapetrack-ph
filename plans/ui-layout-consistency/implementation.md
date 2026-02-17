# UI/UX Layout Consistency Implementation

## Goal
Standardize layout patterns and UI consistency across VapeTrack PH to align with design system guidelines, reduce code duplication, and improve maintainability.

## Prerequisites
**Branch:** `ui-layout-consistency`

Make sure you are currently on the `ui-layout-consistency` branch before beginning implementation.
If the branch does not exist, create it from main:

```bash
git checkout -b ui-layout-consistency
```

---

## Step-by-Step Implementation

### Step 1: Enhance PageContainer Component

**Goal:** Add optional props to PageContainer to support edge cases like full-height layouts and sticky headers while maintaining consistency.

- [x] Open `components/layouts/page-container.tsx`
- [x] Replace the entire file with the enhanced version below:

```typescript
'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: ReactNode
  title?: string
  subtitle?: string
  action?: ReactNode
  className?: string
  /** Full height layout - adds h-full class for pages that need to fill viewport */
  fullHeight?: boolean
  /** Sticky content positioned at top of viewport (below header) */
  stickyTop?: ReactNode
  /** Removes top padding when page has custom header */
  noPaddingTop?: boolean
}

/**
 * PageContainer - Reusable page layout component for consistent spacing and structure
 * 
 * Features:
 * - Consistent padding: 4 (16px) on mobile, 6 (24px) on desktop
 * - Bottom padding to prevent overlap with mobile navigation (80px on mobile)
 * - Optional title, subtitle, and action button
 * - Responsive design with mobile-first approach
 * - Full-height support for special layouts (e.g., POS)
 * - Sticky top content support
 * 
 * Standard Border Radius: rounded-xl (12px) for cards and containers
 * 
 * @example
 * // Basic usage
 * <PageContainer title="Dashboard" subtitle="Today's overview">
 *   <div>Content here</div>
 * </PageContainer>
 * 
 * @example
 * // Full height with sticky top content (POS screen)
 * <PageContainer fullHeight noPaddingTop stickyTop={<SearchBar />}>
 *   <div>Scrollable content</div>
 * </PageContainer>
 */
export function PageContainer({
  children,
  title,
  subtitle,
  action,
  className,
  fullHeight = false,
  stickyTop,
  noPaddingTop = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'flex-1 space-y-4',
        fullHeight ? 'h-full flex flex-col' : '',
        noPaddingTop ? 'p-0' : 'p-4 md:p-6',
        !noPaddingTop && 'pb-20 md:pb-6', // Bottom padding for mobile nav
        className
      )}
    >
      {/* Sticky top content (optional) */}
      {stickyTop && (
        <div className="sticky top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          {stickyTop}
        </div>
      )}

      {/* Page header (title + action) */}
      {(title || action) && (
        <div className={cn('flex items-center justify-between', noPaddingTop && 'px-4 pt-4 md:px-6 md:pt-6')}>
          <div className="space-y-1">
            {title && (
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}

      {/* Main content */}
      <div className={cn(fullHeight && 'flex-1 overflow-y-auto', noPaddingTop && 'px-4 pb-20 md:px-6 md:pb-6')}>
        {children}
      </div>
    </div>
  )
}
```

#### Step 1 Verification Checklist
- [x] No TypeScript errors in `components/layouts/page-container.tsx`
- [x] Run `npm run build` to ensure no build errors
- [x] Visually inspect that existing pages using PageContainer still work (dashboard should still render correctly)

#### Step 1 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

### Step 2: Create Reusable SearchInput Component

**Goal:** Extract search input into a reusable component to eliminate duplication between POS and Inventory pages.

- [x] Create new file `components/ui/search-input.tsx`
- [x] Copy and paste the code below:

```typescript
'use client'

import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

/**
 * SearchInput - Reusable search input component
 * 
 * Features:
 * - Search icon included
 * - Touch-optimized (min-height 44px)
 * - Consistent styling across app
 * - Proper focus states
 * - Accessible
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-secondary border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors"
      />
    </div>
  )
}
```

#### Step 2 Verification Checklist
- [x] No TypeScript errors in `components/ui/search-input.tsx`  
- [x] Run `npm run build` to ensure no build errors

#### Step 2 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

### Step 3: Refactor POS Page to Use PageContainer

**Goal:** Update POS page to use the PageContainer component with full-height and sticky top support for consistency.

- [ ] Open `app/(dashboard)/pos/page.tsx`
- [ ] Replace the entire file content with the code below:

```typescript
'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/components/layouts/page-container'
import { SearchInput } from '@/components/ui/search-input'
import ProductCard from '@/components/pos/product-card'
import CartSheet from '@/components/pos/cart-sheet'
import VariantSelector from '@/components/pos/variant-selector'

const CATEGORIES = ['All', 'Pods', 'Mods', 'Juice', 'Accessories', 'Coils']

interface Product {
  id: number
  name: string
  price: number
  cost: number
  image: string
  category: string
  stock: number
  hasVariants: boolean
}

const PRODUCTS: Product[] = [
  { id: 1, name: 'IQOS Heets', price: 220, cost: 150, image: '🟫', category: 'Pods', stock: 45, hasVariants: true },
  { id: 2, name: 'Voopoo Drag X', price: 2500, cost: 1800, image: '⬛', category: 'Mods', stock: 12, hasVariants: false },
  { id: 3, name: 'Nice Salt 30mg', price: 350, cost: 200, image: '🟦', category: 'Juice', stock: 28, hasVariants: true },
  { id: 4, name: 'Coil Set (5pcs)', price: 450, cost: 250, image: '🔶', category: 'Coils', stock: 5, hasVariants: false },
  { id: 5, name: 'Geekvape Tank', price: 1200, cost: 800, image: '⚪', category: 'Accessories', stock: 18, hasVariants: true },
  { id: 6, name: 'Replacement Pod', price: 150, cost: 100, image: '🟩', category: 'Pods', stock: 62, hasVariants: false },
  { id: 7, name: 'Premium Juice Kit', price: 899, cost: 600, image: '🟥', category: 'Juice', stock: 9, hasVariants: true },
  { id: 8, name: 'Battery Pack', price: 650, cost: 450, image: '🟨', category: 'Accessories', stock: 35, hasVariants: false },
]

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  variant?: string | null
  cost: number
}

export default function POSScreen() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showVariantSelector, setShowVariantSelector] = useState(false)

  const filteredProducts = PRODUCTS.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleAddToCart = (product: Product) => {
    if (product.hasVariants) {
      setSelectedProduct(product)
      setShowVariantSelector(true)
    } else {
      const existingItem = cart.find(item => item.id === product.id)
      if (existingItem) {
        setCart(cart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ))
      } else {
        setCart([...cart, { ...product, quantity: 1, variant: null }])
      }
    }
  }

  const handleAddVariant = (variant: string, quantity: number) => {
    if (!selectedProduct) return

    const existingItem = cart.find(item => item.id === selectedProduct.id && item.variant === variant)
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === selectedProduct.id && item.variant === variant
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ))
    } else {
      setCart([...cart, {
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        cost: selectedProduct.cost,
        quantity,
        variant
      }])
    }
    setShowVariantSelector(false)
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Sticky top content (search + categories + cart button)
  const stickyContent = (
    <div className="px-4 py-3 space-y-3">
      {/* Title & Cart Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">VapeTrack PH</h1>
        <button
          onClick={() => setShowCart(true)}
          className="relative bg-primary text-primary-foreground px-3 py-2 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 touch-target"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search products..."
      />

      {/* Category Chips - Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'px-4 py-2.5 min-h-11 rounded-full text-xs font-semibold whitespace-nowrap transition-all touch-target',
              selectedCategory === category
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'bg-secondary/50 text-foreground hover:bg-secondary'
            )}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <PageContainer fullHeight noPaddingTop stickyTop={stickyContent}>
      {/* Product Grid - 2 Columns */}
      <div className="grid grid-cols-2 gap-3">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={() => handleAddToCart(product)}
          />
        ))}
      </div>

      {/* Cart Sheet */}
      {showCart && <CartSheet items={cart} onClose={() => setShowCart(false)} onUpdateCart={setCart} />}

      {/* Variant Selector */}
      {showVariantSelector && selectedProduct && (
        <VariantSelector
          product={selectedProduct}
          onAddToCart={handleAddVariant}
          onClose={() => setShowVariantSelector(false)}
        />
      )}
    </PageContainer>
  )
}
```

#### Step 3 Verification Checklist
- [ ] No TypeScript errors in `app/(dashboard)/pos/page.tsx`
- [ ] Run `npm run build` to ensure no build errors
- [ ] Navigate to `/pos` in the app
- [ ] Verify search bar works correctly
- [ ] Verify category filtering works
- [ ] Verify product grid displays correctly
- [ ] Verify cart button shows count
- [ ] Verify layout has proper spacing (no overlap with mobile nav)
- [ ] Test on mobile viewport (category chips should scroll horizontally)

#### Step 3 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

### Step 4: Refactor Settings Page to Use PageContainer

**Goal:** Update Settings page to use PageContainer for consistent spacing and remove custom wrapper.

- [ ] Open `app/(dashboard)/settings/page.tsx`
- [ ] Replace the entire file content with the code below:

```typescript
'use client'

import { Settings, LogOut, Bell, Lock, User, HelpCircle } from 'lucide-react'
import { PageContainer } from '@/components/layouts/page-container'

export default function SettingsScreen() {
  const settingsSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile', description: 'Manage your profile' },
        { icon: Lock, label: 'Security', description: 'Password & 2FA' },
      ]
    },
    {
      title: 'App',
      items: [
        { icon: Bell, label: 'Notifications', description: 'Alert preferences' },
        { icon: Settings, label: 'Preferences', description: 'App settings' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help', description: 'FAQs & support' },
      ]
    }
  ]

  return (
    <PageContainer title="Settings">
      {/* Shop Info Card */}
      <div className="bg-card rounded-xl p-4 border border-border/50">
        <h3 className="text-sm font-bold text-foreground mb-2">Shop Info</h3>
        <div className="space-y-2 text-sm">
          <p className="text-foreground"><span className="text-muted-foreground">Shop:</span> VapeTrack PH</p>
          <p className="text-foreground"><span className="text-muted-foreground">Owner:</span> Manager</p>
          <p className="text-foreground"><span className="text-muted-foreground">Version:</span> 1.0.0</p>
        </div>
      </div>

      {/* Settings Sections */}
      {settingsSections.map((section, idx) => (
        <div key={idx} className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-1">{section.title}</h3>
          <div className="space-y-1">
            {section.items.map((item, itemIdx) => {
              const IconComponent = item.icon
              return (
                <button
                  key={itemIdx}
                  className="w-full bg-card rounded-xl p-3 border border-border/50 hover:border-border transition-colors flex items-center gap-3 text-left"
                >
                  <div className="bg-secondary rounded-lg p-2.5">
                    <IconComponent className="w-4 h-4 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Logout Button */}
      <button className="w-full bg-accent/10 hover:bg-accent/20 text-accent rounded-xl py-3 font-semibold transition-colors flex items-center justify-center gap-2 mt-6 touch-target">
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </PageContainer>
  )
}
```

#### Step 4 Verification Checklist
- [ ] No TypeScript errors in `app/(dashboard)/settings/page.tsx`
- [ ] Run `npm run build` to ensure no build errors
- [ ] Navigate to `/settings` in the app
- [ ] Verify "Settings" title appears at top
- [ ] Verify consistent spacing (matches dashboard/inventory)
- [ ] Verify all sections render correctly
- [ ] Verify bottom spacing prevents overlap with mobile nav
- [ ] Verify logout button is accessible (min 44px touch target)

#### Step 4 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

### Step 5: Standardize All Border Radius Values

**Goal:** Replace explicit pixel border radius values with Tailwind's `rounded-xl` class for consistency.

#### Changes to POS Page

- [ ] The code in Step 3 already uses `rounded-xl` consistently

#### Changes to Settings Page

- [ ] The code in Step 4 already uses `rounded-xl` consistently (previously used `rounded-[14px]`)

#### Update globals.css with Standard Border Radius Documentation

- [ ] Open `app/globals.css`
- [ ] After line 155 (after `.touch-target`), add the following comment:

```css
/* Standard border radius: rounded-xl (12px) for cards and containers */
```

#### Step 5 Verification Checklist
- [ ] All cards use `rounded-xl` consistently
- [ ] No `rounded-[12px]` or `rounded-[14px]` in codebase
- [ ] Visual inspection: all cards have consistent rounded corners
- [ ] Run `npm run build` to ensure no build errors

#### Step 5 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

### Step 6: Update MobileNav Active State for Consistency

**Goal:** Ensure MobileNav uses consistent active state styling with background highlight.

- [ ] Open `components/layouts/MobileNav.tsx`
- [ ] Replace line 71 (the className in the Link component) with the updated code below:

```typescript
              className={cn(
                'flex min-w-[44px] min-h-[44px] flex-col items-center justify-center gap-1 px-3 py-2 transition-colors rounded-lg',
                isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground'
              )}
```

#### Step 6 Verification Checklist
- [ ] No TypeScript errors in `components/layouts/MobileNav.tsx`
- [ ] Run `npm run build` to ensure no build errors
- [ ] Test mobile navigation on different viewports
- [ ] Verify active state shows background highlight (primary/10)
- [ ] Verify inactive states are visible
- [ ] Check contrast ratios for accessibility
- [ ] Navigate between pages to see active state change

#### Step 6 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

### Step 7: Enhance Dashboard with Personalized Greeting and Branch Selector

**Goal:** Align dashboard with UI/UX guidelines by adding personalized greeting and branch selector.

- [ ] Open `app/(dashboard)/dashboard/page.tsx`
- [ ] Replace the entire file content with the code below:

```typescript
'use client'

import { TrendingUp, AlertCircle, ShoppingCart } from 'lucide-react'
import { PageContainer } from '@/components/layouts/page-container'

export default function Dashboard() {
  // Sample data
  const userName = 'Juan' // TODO: Replace with actual user data
  const currentBranch = 'Manila (Main)' // TODO: Replace with actual branch data
  
  const todayRevenue = 25500
  const yesterdayRevenue = 18200
  const revenueGrowth = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)

  const todayProfit = 8200
  const profitMargin = ((todayProfit / todayRevenue) * 100).toFixed(1)

  const lowStockProducts = [
    { id: 1, name: 'Sony 18650', stock: 2, minStock: 10 },
    { id: 4, name: 'Coil Pack (5pcs)', stock: 5, minStock: 15 },
  ]

  const topSellers = [
    { name: 'Juice 30ml Bottle', sales: 45, revenue: 11250 },
    { name: 'IQOS Heets', sales: 38, revenue: 8360 },
    { name: 'Replacement Pod', sales: 28, revenue: 4200 },
  ]

  const recentActivity = [
    { type: 'sale', description: 'Sale completed', time: '2 mins ago', amount: 2500 },
    { type: 'restock', description: 'Inventory updated', time: '15 mins ago', amount: null },
    { type: 'sale', description: 'Sale completed', time: '28 mins ago', amount: 1800 },
  ]

  // Get time-based greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <PageContainer>
      {/* Personalized Greeting */}
      <div className="space-y-1">
        <p className="text-lg text-foreground font-medium">{greeting}, {userName}! ☀️</p>
        <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <span>Branch: {currentBranch}</span>
          <span>▼</span>
        </button>
      </div>

      {/* Hero Card - Today's Revenue */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 border border-green-500/20 shadow-lg shadow-green-500/10">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-white/80 font-medium uppercase tracking-wide">Today&apos;s Revenue</p>
            <h2 className="text-3xl font-bold text-white mt-1">₱{todayRevenue.toLocaleString()}</h2>
          </div>
          <div className="bg-white/20 p-2.5 rounded-lg">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-white" />
          <span className="text-sm font-semibold text-white">+{revenueGrowth}% from yesterday</span>
        </div>
        <div className="mt-2 pt-2 border-t border-white/20">
          <p className="text-xs text-white/80">Profit: <span className="font-bold text-white">₱{todayProfit.toLocaleString()} ({profitMargin}%)</span></p>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Profit Card */}
        <div className="bg-card rounded-xl p-3 border border-border/50 hover:border-border transition-colors">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1.5">Today&apos;s Profit</p>
          <h3 className="text-2xl font-bold text-success mb-1">₱{todayProfit.toLocaleString()}</h3>
          <p className="text-xs text-muted-foreground">{profitMargin}% margin</p>
        </div>

        {/* Transactions Card */}
        <div className="bg-card rounded-xl p-3 border border-border/50 hover:border-border transition-colors">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1.5">Transactions</p>
          <h3 className="text-2xl font-bold text-foreground mb-1">24</h3>
          <p className="text-xs text-muted-foreground">+3 from yesterday</p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-accent" />
          Low Stock Alerts
        </h3>
        {lowStockProducts.map(product => (
          <div key={product.id} className="bg-accent/10 border-l-4 border-accent rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-foreground">{product.name}</p>
              <p className="text-xs text-muted-foreground">Only {product.stock} left</p>
            </div>
            <button className="text-xs font-bold text-accent bg-accent/20 px-3 py-1.5 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center">
              Restock
            </button>
          </div>
        ))}
      </div>

      {/* Top Sellers */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-foreground">🔥 Top Sellers Today</h3>
        {topSellers.map((item, idx) => (
          <div key={idx} className="bg-secondary/30 rounded-xl p-3 border border-border/30">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm text-foreground">{item.name}</p>
              <span className="text-xs font-bold text-primary">#{idx + 1}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{item.sales} sold</span>
              <span className="text-success font-semibold">₱{item.revenue.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-foreground">📝 Recent Activity</h3>
        <div className="space-y-1">
          {recentActivity.map((activity, idx) => (
            <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
              <div className={`w-2 h-2 rounded-full mt-2 ${activity.type === 'sale' ? 'bg-primary' : 'bg-warning'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
              {activity.amount && (
                <span className="text-sm font-bold text-primary">₱{activity.amount.toLocaleString()}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
```

#### Step 7 Verification Checklist
- [ ] No TypeScript errors in `app/(dashboard)/dashboard/page.tsx`
- [ ] Run `npm run build` to ensure no build errors
- [ ] Navigate to `/dashboard` in the app
- [ ] Verify personalized greeting shows (with time-based greeting)
- [ ] Verify branch selector button renders
- [ ] Verify hero card has green gradient background
- [ ] Verify profit is shown in hero card
- [ ] Verify all sections render correctly
- [ ] Verify responsive design on mobile and desktop

#### Step 7 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

### Step 8: Create Layout System Documentation

**Goal:** Create comprehensive documentation to prevent future inconsistencies and guide developers.

- [ ] Create new file `docs/development/layout-system.md`
- [ ] Copy and paste the code below:

```markdown
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
```

#### Step 8 Verification Checklist
- [ ] Documentation file created successfully
- [ ] All sections are complete and accurate
- [ ] Examples match current implementation
- [ ] No broken links or references
- [ ] Readable and well-formatted

#### Step 8 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

## Final Success Criteria

After completing all steps, verify:

- [ ] All pages use `PageContainer` consistently
- [ ] All border radius values use `rounded-xl`
- [ ] All page titles use `text-2xl font-bold`
- [ ] Search inputs use shared `SearchInput` component
- [ ] Navigation active states are consistent (MobileNav has `bg-primary/10`)
- [ ] POS page integrates with layout system properly
- [ ] Settings page integrates with layout system properly
- [ ] Dashboard has personalized greeting and branch selector
- [ ] Dashboard hero card uses green gradient
- [ ] Layout system is documented
- [ ] No visual regressions
- [ ] All touch targets meet 44×44px minimum
- [ ] Mobile navigation has proper clearance on all pages
- [ ] Responsive design works on mobile and desktop
- [ ] `npm run build` succeeds with no errors
- [ ] All TypeScript errors resolved

---

## Technology Stack

**Framework:** Next.js 16.1.6 (App Router)  
**UI Library:** React 19.2.3  
**Styling:** Tailwind CSS 4  
**TypeScript:** 5.x  
**State:** Zustand, React hooks  
**Icons:** Lucide React  

**Build Command:** `npm run build`  
**Dev Server:** `npm run dev`  
**Lint:** `npm run lint`

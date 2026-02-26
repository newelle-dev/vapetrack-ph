# Day 16: POS Product Grid & Cart Polish

**Branch:** `feat/day-16-pos-grid-cart-polish`
**Description:** Enhance existing POS components to match Day 16 specs — debounced search, swipe-to-delete in cart, pulse animation on badge, 4-col desktop grid, 48×48px quantity steppers, and overall polish.

## Goal
Day 15 already delivered 90% of Day 16's requirements (product grid, cart, search, category chips, responsive layout). This plan addresses the remaining **gaps** between what exists and the Day 16 spec to bring the POS to full definition-of-done quality.

## Gap Analysis

| Day 16 Requirement | Current State | Action Needed |
|---|---|---|
| 2-col mobile, 3-col tablet, **4-col desktop** | Grid is `grid-cols-2 md:grid-cols-3 lg:grid-cols-3` | Add `xl:grid-cols-4` |
| Product card 164×200px size | Cards use `aspect-square` image | Tweak to use fixed height image (120px) + info area |
| Low stock badge: Yellow, 12px, "LOW" label | Badge exists but says `Nx` or `⚠ Out` | Add explicit "LOW" text with yellow bg |
| Active state: Scale 0.98 | Has `active:scale-[0.98]` on button, not on card tap | Add `active:scale-[0.98]` to card wrapper |
| Search bar: 56px height | Current is `min-h-[44px]` | Increase to `h-14` (56px) |
| **Debounced 200ms** search | No debounce, immediate filtering | Add `useDebouncedValue` hook (200ms) |
| Focus state: expand to full width | Not implemented | Skip — no recent searches needed |
| Cart quantity stepper **48×48px** buttons | Current cart buttons are `p-1.5` (~28px) | Increase to `w-12 h-12` (48px) |
| **Swipe left to delete** cart items | Only trash icon button | Implement touch swipe gesture → reveal red delete |
| Cart badge **pulse animation on add** | Badge appears with `animate-in zoom-in` | Add `animate-pulse` on count change |
| "Clear Cart" button: Outlined, **48px height** | Current is text button "Clear All" | Change to outlined button with proper height |
| Floating checkout button: **64px** height, primary green gradient | Current is `h-16` (64px) ✅ | Already correct ✅ |
| Touch targets ≥ 44×44px | Most have `touch-target` class ✅ | Verify all interactive elements |
| Lazy load product images | Images use emoji placeholder `📦` | Keep emoji placeholders as-is |
| Optimistic UI | Zustand updates are instant ✅ | Already correct ✅ |

## Implementation Steps

### Step 1: Add Debounce Hook + Search Bar Polish
**Files:** `lib/hooks/useDebounce.ts` (NEW), `components/ui/search-input.tsx`, `app/(dashboard)/pos/page.tsx`
**What:**
1. Create a `useDebounce(value, delay)` custom hook that returns a debounced value after `delay` ms (200ms for POS search).
2. Update `SearchInput` component: increase height to 56px (`h-14`).
3. In POS page, wrap `searchQuery` with the debounce hook so filtering is debounced at 200ms instead of firing on every keystroke.
**Testing:** Type quickly in search bar — products should only filter after 200ms pause. Search bar should be visually taller (56px).

### Step 2: Product Grid Responsive Columns + Card Polish
**Files:** `app/(dashboard)/pos/page.tsx`, `components/pos/product-card.tsx`
**What:**
1. Update grid classes to `grid-cols-2 md:grid-cols-3 xl:grid-cols-4` for proper 2/3/4 column breakpoints.
2. Update `ProductCard`:
   - Low stock badge: Change to yellow background with "LOW" text (12px) when `minStock <= 5 && minStock > 0`.
   - Add `active:scale-[0.98]` to the card wrapper div (entire card, not just the button).
   - Keep emoji placeholder (`📦`) as-is for now.
   - Keep price at `text-lg` (≈18px bold, primary green) — already correct.
   - Ensure product name uses `text-sm` (14px) with `line-clamp-2` — already correct.
3. Update skeleton grid to match new responsive columns.
**Testing:** Verify 2-col on mobile (375px), 3-col on tablet (768px), 4-col on desktop (1280px+). Low stock shows yellow "LOW" badge. Tapping card gives visual scale feedback.

### Step 3: Cart Swipe-to-Delete + Quantity Stepper Sizing
**Files:** `components/pos/cart-sheet.tsx`, `components/pos/pos-cart-sidebar.tsx`
**What:**
1. **Swipe-to-delete** on cart items (mobile):
   - Wrap each cart item in a `SwipeableCartItem` local component.
   - Track touch events (`onTouchStart`, `onTouchMove`, `onTouchEnd`).
   - When swiped left > 80px, reveal a red delete button behind the item.
   - Tapping the red delete button calls `removeItem(variantId)`.
   - On swipe back or release under threshold, spring back to original position.
   - Use CSS `transform: translateX()` with `transition` for smooth animation.
2. **Quantity stepper buttons** in both `CartSheet` and `PosCartSidebar`:
   - Increase to `w-12 h-12` (48×48px) per spec.
   - Keep `touch-target` class.
3. **"Clear Cart" button**:
   - Change from text link style to an outlined button with `h-12` (48px), `border border-border` styling.
4. **Cart badge pulse animation**:
   - In POS page, add a pulse animation class to the cart badge whenever `itemCount` changes.
   - Use a short-lived `animate-pulse` or custom keyframe that triggers on count change via a `useEffect` + `setTimeout` pattern.
**Testing:**
- Mobile: Swipe left on a cart item → red delete button appears → tap to remove item.
- Swipe back or insufficient swipe → item springs back.
- Quantity +/- buttons are 48×48px (verify with DevTools).
- "Clear Cart" button is full outlined, 48px height.
- Adding item makes the cart badge pulse briefly.

### Step 4: Final Polish + Roadmap Update
**Files:** `docs/product/roadmap.md`
**What:**
1. Update the Day 16 section of `roadmap.md` to mark all items as `[x]` complete.
2. Verify all definition-of-done items pass:
   - POS page loads quickly (FCP < 1.5s — test with dev tools)
   - Product grid displays all active variants (2-col on mobile)
   - Tapping product opens variant selector OR adds to cart
   - Cart badge pulses on add
   - Cart shows correct quantities and prices
   - Quantity stepper: 48×48px buttons
   - Can swipe left on cart item to delete
   - Subtotal calculates correctly in real-time
   - Floating checkout button: 64px height, green gradient
   - All touch targets ≥ 44×44px
   - Works smoothly on mobile
3. Run dev server, verify no console errors.
**Testing:** Full visual QA pass on mobile (375px), tablet (768px), and desktop (1280px+). Verify all interactions work smoothly.

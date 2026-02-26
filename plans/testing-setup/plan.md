# Testing Setup & Implementation

**Branch:** `feat/testing-infrastructure`
**Description:** Install Vitest + React Testing Library, write unit tests for all pure logic, and expand E2E coverage for critical business flows.

## Goal
Establish a robust, maintainable testing foundation for VapeTrack PH. Currently the project only has Playwright E2E tests (3 spec files) and zero unit/integration tests. This plan installs the unit testing stack (Vitest + RTL), writes tests bottom-up from the testing pyramid (pure functions → Zod schemas → Zustand store → E2E), and adds npm scripts so tests run locally and in CI.

---

## Implementation Steps

### Step 1: Install & Configure Vitest + React Testing Library
**Files:**
- `package.json` (new devDependencies)
- `vitest.config.ts` (new)
- `vitest.setup.ts` (new)
- `tsconfig.json` (minor adjustment)

**What:**
1. Install dev dependencies:
   ```
   npm i -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitejs/plugin-react jsdom
   ```
2. Create `vitest.config.ts` at project root:
   - `environment: 'jsdom'` for component tests
   - `setupFiles: ['./vitest.setup.ts']`
   - Path aliases matching `tsconfig.json` (`@/*` → `./*`)
   - `include: ['**/*.test.ts', '**/*.test.tsx']`
   - `globals: true` so `describe/it/expect` are available without imports
3. Create `vitest.setup.ts`:
   - Import `@testing-library/jest-dom` for DOM matchers (`toBeInTheDocument`, etc.)
4. Add npm scripts to `package.json`:
   ```json
   "test": "vitest run",
   "test:watch": "vitest",
   "test:coverage": "vitest run --coverage"
   ```

**Testing:** Run `npm test` — should exit with "no test files found" (no tests yet), confirming config is valid.

---

### Step 2: Unit Tests — Zod Validation Schemas
**Files:**
- `lib/validations/__tests__/auth.test.ts` (new)
- `lib/validations/__tests__/product.test.ts` (new)
- `lib/validations/__tests__/inventory.test.ts` (new)
- `lib/validations/__tests__/staff.test.ts` (new)
- `lib/validations/__tests__/branch.test.ts` (new)
- `lib/validations/__tests__/category.test.ts` (new)
- `lib/validations/__tests__/organization.test.ts` (new)

**What:**
Test every Zod schema with `safeParse()` — valid data passes, invalid data returns specific error messages. These are pure functions with zero dependencies, making them the fastest and most reliable tests.

Key test cases per schema:
| Schema | Happy Path | Edge Cases |
|--------|-----------|------------|
| `loginSchema` | Valid email + password ≥ 6 | Empty email, short password |
| `signupSchema` | All fields valid, passwords match | Passwords don't match, short name |
| `createProductSchema` | Product + 1 variant | No variants, invalid SKU chars, negative price |
| `stockAdjustmentSchema` | Valid UUID + positive qty | Non-integer qty, invalid movement_type |
| `createStaffSchema` | Name + 4-digit PIN | 3-digit PIN, 7-digit PIN, non-numeric PIN |
| `updateStaffSchema` | Name only (PIN optional) | Empty PIN string (should pass as optional) |
| `branchCreateSchema` | Name ≥ 2 chars | 1-char name |
| `categorySchema` | Name + optional parent_id | Invalid UUID for parent_id |
| `organizationUpdateSchema` | Name ≥ 2 chars | 1-char name |

**Testing:** `npm test -- --run` — all validation tests pass.

---

### Step 3: Unit Tests — Pure Utility Functions
**Files:**
- `lib/utils/__tests__/slugify.test.ts` (new)
- `lib/auth/__tests__/password.test.ts` (new)

**What:**

**`slugify.test.ts`:**
- Basic: `"Vape Shop Manila"` → `"vape-shop-manila"`
- Unicode: Filipino/accented chars normalized properly
- Special chars: `"Shop #1 @Manila!"` → `"shop-1-manila"`
- Edge: empty string, only special chars, leading/trailing hyphens trimmed
- `generateUniqueSlug`: returns `{base}-{hex}` format, suffix is 6 hex chars by default

**`password.test.ts`:**
- `hashPin("1234")` returns a bcrypt hash (starts with `$2a$` or `$2b$`)
- `verifyPin("1234", hash)` returns `true`
- `verifyPin("5678", hash)` returns `false`
- Different calls to `hashPin` with the same PIN produce different hashes (salt uniqueness)

**Testing:** `npm test -- --run` — all utility tests pass.

---

### Step 4: Unit Tests — Zustand Cart Store
**Files:**
- `lib/hooks/__tests__/useCart.test.ts` (new)

**What:**
Test the Zustand store by importing it directly (no React rendering needed). Reset store state between tests using `useCartStore.setState({ items: [] })`.

Test cases:
- **addItem:** Adds new item with `quantity: 1`
- **addItem (duplicate):** Increments quantity instead of adding new
- **removeItem:** Removes by `variantId`
- **updateQuantity:** Updates to specific qty
- **updateQuantity(0):** Removes the item (delegates to `removeItem`)
- **clearCart:** Empties all items
- **getTotal:** `sum(price × quantity)` across items
- **getItemCount:** `sum(quantity)` across items
- **getProfit:** `sum((price - capitalCost) × quantity)` across items
- **Multiple items:** Total/count/profit calculated correctly with 3+ items

**Testing:** `npm test -- --run` — all cart store tests pass.

---

### Step 5: Expand E2E Tests — POS & Inventory Critical Paths
**Files:**
- `e2e/helpers/auth.ts` (new — shared login helper)
- `e2e/pos-checkout.spec.ts` (new)
- `e2e/inventory-management.spec.ts` (new)
- `e2e/staff-management.spec.ts` (new)

**What:**

**`helpers/auth.ts`:**
Extract reusable `signUpAndLogin(page)` helper from existing specs to reduce duplication.

**`pos-checkout.spec.ts`:**
- Navigate to POS page as authenticated user
- Verify product grid renders
- Add product to cart → badge count increments
- Adjust quantity in cart
- Remove item from cart
- [NEEDS CLARIFICATION] Is a full checkout flow implemented yet? If so, test the complete checkout → confirm → receipt flow.

**`inventory-management.spec.ts`:**
- Navigate to inventory page
- Verify stock levels display
- Perform stock adjustment (stock_in)
- Verify updated quantity
- Check stock history records the movement

**`staff-management.spec.ts`:**
- Navigate to staff page as owner
- Create new staff member with PIN
- Verify staff appears in list
- Edit staff permissions
- Delete (soft-delete) staff member
- Verify staff is removed from list

**Testing:** `npm run test:e2e` — all E2E tests pass against a running dev server. Existing 3 spec files remain green.

---

## Summary

| Step | Layer | # Test Files | Estimated Tests |
|------|-------|-------------|-----------------|
| 1    | Config | 2 config files | — |
| 2    | Unit | 7 files | ~40-50 tests |
| 3    | Unit | 2 files | ~15-20 tests |
| 4    | Unit | 1 file | ~10-12 tests |
| 5    | E2E  | 3 files + 1 helper | ~10-15 tests |
| **Total** | | **15 new files** | **~75-97 tests** |

## Open Questions

1. **POS Checkout Flow:** Is the full checkout (order creation, receipt) implemented yet, or only the cart UI? This affects E2E test scope for Step 5.
2. **CI Pipeline:** Should we also add a GitHub Actions workflow file in this PR, or keep that for a separate effort?
3. **Coverage Threshold:** Would you like to enforce a minimum code coverage percentage (e.g., 80%) from the start?

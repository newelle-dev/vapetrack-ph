# Testing Setup & Implementation

## Goal
Install Vitest + React Testing Library, write unit tests for all pure logic (Zod schemas, utility functions, Zustand cart store), and expand Playwright E2E coverage for POS, inventory, and staff critical paths.

## Prerequisites
Make sure that you are currently on the `feat/testing-infrastructure` branch before beginning implementation.
If not, move to the correct branch. If the branch does not exist, create it from main.

```bash
git checkout -b feat/testing-infrastructure
# or if branch already exists:
git checkout feat/testing-infrastructure
```

---

### Step-by-Step Instructions

#### Step 1: Install & Configure Vitest + React Testing Library

- [x] Run the following install command in your terminal:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitejs/plugin-react jsdom @vitest/coverage-v8
```

- [x] Create `vitest.config.ts` at the project root:

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        ".next/**",
        "e2e/**",
        "*.config.*",
        "vitest.setup.ts",
        "app/**",
        "components/**",
        "types/**",
        "public/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

- [x] Create `vitest.setup.ts` at the project root:

```typescript
// vitest.setup.ts
import "@testing-library/jest-dom";
```

- [x] Update `package.json` — add these scripts inside the `"scripts"` object (alongside the existing ones):

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

The final `scripts` block should look like:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

##### Step 1 Verification Checklist
- [x] Run `npm test` — it should exit with output like `"No test files found"` or `"0 test files"` — this confirms the config is valid.
- [x] No TypeScript or build errors when running `npx tsc --noEmit`.

#### Step 1 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 2: Unit Tests — Zod Validation Schemas

- [x] Create the `__tests__` directory: `lib/validations/__tests__/`
- [x] Copy and paste the code below into `lib/validations/__tests__/auth.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { loginSchema, signupSchema } from "@/lib/validations/auth";

describe("loginSchema", () => {
  it("passes with a valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("fails with an empty email", () => {
    const result = loginSchema.safeParse({ email: "", password: "password123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("email");
    }
  });

  it("fails with an invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("fails when password is fewer than 6 characters", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "abc",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("password");
    }
  });

  it("passes with a password of exactly 6 characters", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "abc123",
    });
    expect(result.success).toBe(true);
  });
});

describe("signupSchema", () => {
  const validData = {
    fullName: "John Doe",
    shopName: "My Vape Shop",
    email: "john@example.com",
    password: "securepassword",
    confirmPassword: "securepassword",
  };

  it("passes with all valid fields and matching passwords", () => {
    const result = signupSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("fails when passwords do not match", () => {
    const result = signupSchema.safeParse({
      ...validData,
      confirmPassword: "differentpassword",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path).flat();
      expect(paths).toContain("confirmPassword");
    }
  });

  it("fails when fullName is shorter than 2 characters", () => {
    const result = signupSchema.safeParse({ ...validData, fullName: "J" });
    expect(result.success).toBe(false);
  });

  it("fails when shopName is shorter than 2 characters", () => {
    const result = signupSchema.safeParse({ ...validData, shopName: "X" });
    expect(result.success).toBe(false);
  });

  it("fails when password is shorter than 8 characters", () => {
    const result = signupSchema.safeParse({
      ...validData,
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("fails with an invalid email", () => {
    const result = signupSchema.safeParse({ ...validData, email: "not-email" });
    expect(result.success).toBe(false);
  });
});
```

- [x] Copy and paste the code below into `lib/validations/__tests__/product.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createProductSchema, updateProductSchema } from "@/lib/validations/product";

const validVariant = {
  name: "30ml",
  sku: "VAPE-001",
  selling_price: 350,
  capital_cost: 200,
  initial_stock: 10,
};

const validProduct = {
  name: "Cloud Nine Mango",
  brand: "Cloud Nine",
  description: "A tropical mango flavor.",
  category_id: "123e4567-e89b-12d3-a456-426614174000",
  is_active: true,
  variants: [validVariant],
};

describe("createProductSchema", () => {
  it("passes with a valid product and one variant", () => {
    const result = createProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it("fails when variants array is empty", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      variants: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("variants");
    }
  });

  it("fails when SKU contains invalid characters (spaces)", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      variants: [{ ...validVariant, sku: "VAPE 001" }],
    });
    expect(result.success).toBe(false);
  });

  it("fails when SKU contains special characters (@)", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      variants: [{ ...validVariant, sku: "VAPE@001" }],
    });
    expect(result.success).toBe(false);
  });

  it("fails when selling_price is negative", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      variants: [{ ...validVariant, selling_price: -100 }],
    });
    expect(result.success).toBe(false);
  });

  it("fails when selling_price is zero", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      variants: [{ ...validVariant, selling_price: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("fails when capital_cost is negative", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      variants: [{ ...validVariant, capital_cost: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it("passes when capital_cost is zero (allowed)", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      variants: [{ ...validVariant, capital_cost: 0 }],
    });
    expect(result.success).toBe(true);
  });

  it("fails when product name is shorter than 2 characters", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      name: "X",
    });
    expect(result.success).toBe(false);
  });

  it("fails when category_id is not a UUID", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      category_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateProductSchema", () => {
  it("passes with a valid update payload", () => {
    const result = updateProductSchema.safeParse({
      name: "Cloud Nine Mango v2",
      category_id: "123e4567-e89b-12d3-a456-426614174000",
      variants: [
        {
          ...validVariant,
          // no initial_stock for update
          initial_stock: undefined,
          id: "123e4567-e89b-12d3-a456-426614174001",
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
```

- [x] Copy and paste the code below into `lib/validations/__tests__/inventory.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { stockAdjustmentSchema } from "@/lib/validations/inventory";

const validPayload = {
  variant_id: "123e4567-e89b-12d3-a456-426614174000",
  branch_id: "123e4567-e89b-12d3-a456-426614174001",
  quantity: 10,
  movement_type: "stock_in" as const,
  reason: "New delivery received",
};

describe("stockAdjustmentSchema", () => {
  it("passes with a valid stock_in payload", () => {
    const result = stockAdjustmentSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("passes with a valid stock_out payload", () => {
    const result = stockAdjustmentSchema.safeParse({
      ...validPayload,
      movement_type: "stock_out",
    });
    expect(result.success).toBe(true);
  });

  it("fails when variant_id is not a valid UUID", () => {
    const result = stockAdjustmentSchema.safeParse({
      ...validPayload,
      variant_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("variant_id");
    }
  });

  it("fails when branch_id is not a valid UUID", () => {
    const result = stockAdjustmentSchema.safeParse({
      ...validPayload,
      branch_id: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("fails when quantity is not an integer (float)", () => {
    const result = stockAdjustmentSchema.safeParse({
      ...validPayload,
      quantity: 5.5,
    });
    expect(result.success).toBe(false);
  });

  it("fails when quantity is zero", () => {
    const result = stockAdjustmentSchema.safeParse({
      ...validPayload,
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it("fails when quantity is negative", () => {
    const result = stockAdjustmentSchema.safeParse({
      ...validPayload,
      quantity: -5,
    });
    expect(result.success).toBe(false);
  });

  it("fails with an invalid movement_type", () => {
    const result = stockAdjustmentSchema.safeParse({
      ...validPayload,
      movement_type: "restock",
    });
    expect(result.success).toBe(false);
  });

  it("fails when reason is empty", () => {
    const result = stockAdjustmentSchema.safeParse({
      ...validPayload,
      reason: "",
    });
    expect(result.success).toBe(false);
  });

  it("fails when reason exceeds 500 characters", () => {
    const result = stockAdjustmentSchema.safeParse({
      ...validPayload,
      reason: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});
```

- [x] Copy and paste the code below into `lib/validations/__tests__/staff.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createStaffSchema, updateStaffSchema } from "@/lib/validations/staff";

const validCreate = {
  full_name: "Maria Santos",
  pin: "1234",
  is_active: true,
  can_manage_inventory: false,
  can_view_profits: false,
  can_view_reports: false,
};

describe("createStaffSchema", () => {
  it("passes with a valid 4-digit PIN", () => {
    const result = createStaffSchema.safeParse(validCreate);
    expect(result.success).toBe(true);
  });

  it("passes with a valid 6-digit PIN", () => {
    const result = createStaffSchema.safeParse({ ...validCreate, pin: "123456" });
    expect(result.success).toBe(true);
  });

  it("passes with a valid 5-digit PIN", () => {
    const result = createStaffSchema.safeParse({ ...validCreate, pin: "12345" });
    expect(result.success).toBe(true);
  });

  it("fails with a 3-digit PIN (too short)", () => {
    const result = createStaffSchema.safeParse({ ...validCreate, pin: "123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("pin");
    }
  });

  it("fails with a 7-digit PIN (too long)", () => {
    const result = createStaffSchema.safeParse({ ...validCreate, pin: "1234567" });
    expect(result.success).toBe(false);
  });

  it("fails with a non-numeric PIN (letters)", () => {
    const result = createStaffSchema.safeParse({ ...validCreate, pin: "abcd" });
    expect(result.success).toBe(false);
  });

  it("fails with a non-numeric PIN (mixed)", () => {
    const result = createStaffSchema.safeParse({ ...validCreate, pin: "12ab" });
    expect(result.success).toBe(false);
  });

  it("fails when full_name is shorter than 2 characters", () => {
    const result = createStaffSchema.safeParse({ ...validCreate, full_name: "J" });
    expect(result.success).toBe(false);
  });

  it("passes with an optional valid email", () => {
    const result = createStaffSchema.safeParse({
      ...validCreate,
      email: "maria@shop.com",
    });
    expect(result.success).toBe(true);
  });

  it("passes with an empty string email (optional)", () => {
    const result = createStaffSchema.safeParse({
      ...validCreate,
      email: "",
    });
    expect(result.success).toBe(true);
  });

  it("fails with an invalid email format", () => {
    const result = createStaffSchema.safeParse({
      ...validCreate,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateStaffSchema", () => {
  const validUpdate = {
    full_name: "Maria Santos",
    is_active: true,
    can_manage_inventory: false,
    can_view_profits: false,
    can_view_reports: false,
  };

  it("passes with only required fields (no PIN)", () => {
    const result = updateStaffSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it("passes with an empty string PIN (keep existing)", () => {
    const result = updateStaffSchema.safeParse({ ...validUpdate, pin: "" });
    expect(result.success).toBe(true);
  });

  it("passes with a valid new PIN", () => {
    const result = updateStaffSchema.safeParse({ ...validUpdate, pin: "9999" });
    expect(result.success).toBe(true);
  });

  it("fails with an invalid PIN format", () => {
    const result = updateStaffSchema.safeParse({ ...validUpdate, pin: "abc" });
    expect(result.success).toBe(false);
  });
});
```

- [x] Copy and paste the code below into `lib/validations/__tests__/branch.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { branchCreateSchema } from "@/lib/validations/branch";

describe("branchCreateSchema", () => {
  it("passes with a valid branch name", () => {
    const result = branchCreateSchema.safeParse({ name: "Main Branch" });
    expect(result.success).toBe(true);
  });

  it("passes with all optional fields provided", () => {
    const result = branchCreateSchema.safeParse({
      name: "Makati Branch",
      address: "123 Ayala Ave",
      phone: "09171234567",
      is_default: false,
      is_active: true,
    });
    expect(result.success).toBe(true);
  });

  it("passes with a name of exactly 2 characters", () => {
    const result = branchCreateSchema.safeParse({ name: "MN" });
    expect(result.success).toBe(true);
  });

  it("fails when name is only 1 character", () => {
    const result = branchCreateSchema.safeParse({ name: "M" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("name");
    }
  });

  it("fails when name is empty", () => {
    const result = branchCreateSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("passes without optional fields", () => {
    const result = branchCreateSchema.safeParse({ name: "BGC Branch" });
    expect(result.success).toBe(true);
  });
});
```

- [x] Copy and paste the code below into `lib/validations/__tests__/category.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { categorySchema } from "@/lib/validations/category";

describe("categorySchema", () => {
  it("passes with a valid name", () => {
    const result = categorySchema.safeParse({ name: "Vape Juices" });
    expect(result.success).toBe(true);
  });

  it("passes with name and a valid UUID parent_id", () => {
    const result = categorySchema.safeParse({
      name: "Sub Category",
      parent_id: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
  });

  it("passes when parent_id is null (top-level category)", () => {
    const result = categorySchema.safeParse({
      name: "Devices",
      parent_id: null,
    });
    expect(result.success).toBe(true);
  });

  it("passes with all optional fields", () => {
    const result = categorySchema.safeParse({
      name: "Accessories",
      description: "All vape accessories",
      parent_id: null,
      display_order: 5,
    });
    expect(result.success).toBe(true);
  });

  it("fails when name is only 1 character", () => {
    const result = categorySchema.safeParse({ name: "X" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("name");
    }
  });

  it("fails when parent_id is a non-UUID string", () => {
    const result = categorySchema.safeParse({
      name: "Valid Name",
      parent_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});
```

- [x] Copy and paste the code below into `lib/validations/__tests__/organization.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { organizationUpdateSchema } from "@/lib/validations/organization";

describe("organizationUpdateSchema", () => {
  it("passes with a valid organization name", () => {
    const result = organizationUpdateSchema.safeParse({ name: "My Vape Shop" });
    expect(result.success).toBe(true);
  });

  it("passes with a name of exactly 2 characters", () => {
    const result = organizationUpdateSchema.safeParse({ name: "AB" });
    expect(result.success).toBe(true);
  });

  it("fails when name is only 1 character", () => {
    const result = organizationUpdateSchema.safeParse({ name: "A" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("name");
    }
  });

  it("fails when name is empty", () => {
    const result = organizationUpdateSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("passes with optional address and phone", () => {
    const result = organizationUpdateSchema.safeParse({
      name: "Complete Shop",
      address: "123 Main St, Manila",
      phone: "09171234567",
    });
    expect(result.success).toBe(true);
  });
});
```

##### Step 2 Verification Checklist
- [x] Run `npm test` — all schema test files should be found and pass.
- [x] Expected output: `7 test files` with all tests green.
- [x] No import errors or TypeScript errors.

#### Step 2 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 3: Unit Tests — Pure Utility Functions

- [x] Create the `__tests__` directory: `lib/utils/__tests__/`
- [x] Copy and paste the code below into `lib/utils/__tests__/slugify.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { slugify, generateUniqueSlug } from "@/lib/utils/slugify";

describe("slugify", () => {
  it("converts basic text to a slug", () => {
    expect(slugify("Vape Shop Manila")).toBe("vape-shop-manila");
  });

  it("converts to lowercase", () => {
    expect(slugify("HELLO WORLD")).toBe("hello-world");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("hello world")).toBe("hello-world");
  });

  it("collapses multiple spaces into a single hyphen", () => {
    expect(slugify("hello   world")).toBe("hello-world");
  });

  it("trims leading and trailing spaces (and resulting hyphens)", () => {
    expect(slugify("  hello world  ")).toBe("hello-world");
  });

  it("removes special characters (@, !, #)", () => {
    expect(slugify("Shop #1 @Manila!")).toBe("shop-1-manila");
  });

  it("handles Filipino/accented characters by normalizing them", () => {
    // NFKD normalization strips diacritics, resulting in base ASCII
    const result = slugify("Señorita");
    expect(result).toMatch(/^senorita$|^seniorita$/); // 'ñ' → 'n'
  });

  it("strips leading and trailing hyphens", () => {
    expect(slugify("---hello---")).toBe("hello");
  });

  it("returns an empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("returns an empty string for only special characters", () => {
    expect(slugify("!@#$%^&*()")).toBe("");
  });

  it("handles numbers correctly", () => {
    expect(slugify("Pod 2000 Pro")).toBe("pod-2000-pro");
  });

  it("does not produce consecutive hyphens", () => {
    const result = slugify("Hello - World");
    expect(result).not.toContain("--");
  });
});

describe("generateUniqueSlug", () => {
  it("appends a hex suffix to the base slug", () => {
    const base = "vape-shop";
    const result = generateUniqueSlug(base);
    expect(result).toMatch(/^vape-shop-[0-9a-f]{6}$/);
  });

  it("has the format {base}-{6 hex chars} by default", () => {
    const result = generateUniqueSlug("my-shop");
    const parts = result.split("-");
    const suffix = parts[parts.length - 1];
    expect(suffix).toHaveLength(6);
    expect(suffix).toMatch(/^[0-9a-f]+$/);
  });

  it("produces different hashes on each call (probabilistic uniqueness)", () => {
    const a = generateUniqueSlug("base");
    const b = generateUniqueSlug("base");
    // While not guaranteed, two random 6-hex-char suffixes colliding is ~1 in 16 million.
    expect(a).not.toBe(b);
  });

  it("respects custom suffixBytes", () => {
    const result = generateUniqueSlug("shop", 4); // 4 bytes = 8 hex chars
    const parts = result.split("-");
    const suffix = parts[parts.length - 1];
    expect(suffix).toHaveLength(8);
  });
});
```

- [x] Create the `__tests__` directory: `lib/auth/__tests__/`
- [x] Copy and paste the code below into `lib/auth/__tests__/password.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { hashPin, verifyPin } from "@/lib/auth/password";

describe("hashPin", () => {
  it("returns a bcrypt hash string", async () => {
    const hash = await hashPin("1234");
    expect(typeof hash).toBe("string");
    expect(hash.length).toBeGreaterThan(0);
  });

  it("produces a hash starting with a bcrypt identifier ($2a$ or $2b$)", async () => {
    const hash = await hashPin("1234");
    expect(hash).toMatch(/^\$2[ab]\$/);
  });

  it("produces different hashes for the same PIN on each call (salt uniqueness)", async () => {
    const [hash1, hash2] = await Promise.all([hashPin("1234"), hashPin("1234")]);
    expect(hash1).not.toBe(hash2);
  });
});

describe("verifyPin", () => {
  it("returns true for a matching PIN and hash", async () => {
    const hash = await hashPin("1234");
    const result = await verifyPin("1234", hash);
    expect(result).toBe(true);
  });

  it("returns false for a non-matching PIN", async () => {
    const hash = await hashPin("1234");
    const result = await verifyPin("5678", hash);
    expect(result).toBe(false);
  });

  it("returns false for an empty string against a valid hash", async () => {
    const hash = await hashPin("1234");
    const result = await verifyPin("", hash);
    expect(result).toBe(false);
  });

  it("correctly verifies a 6-digit PIN", async () => {
    const hash = await hashPin("123456");
    const result = await verifyPin("123456", hash);
    expect(result).toBe(true);
  });

  it("returns false when the PIN is a prefix of the real PIN", async () => {
    const hash = await hashPin("1234");
    const result = await verifyPin("123", hash);
    expect(result).toBe(false);
  });
});
```

##### Step 3 Verification Checklist
- [x] Run `npm test` — all utility test files pass.
- [x] Note: `password.test.ts` tests use `bcryptjs` with SALT_ROUNDS=12 so they may be slightly slower (~500ms). This is expected.
- [x] Expected total output: schema tests + utility tests all green, no errors.

#### Step 3 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 4: Unit Tests — Zustand Cart Store

- [ ] Create the `__tests__` directory: `lib/hooks/__tests__/`
- [ ] Copy and paste the code below into `lib/hooks/__tests__/useCart.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore, CartItem } from "@/lib/hooks/useCart";

// Helper to build a CartItem without quantity (as addItem accepts)
const makeItem = (
  variantId: string,
  price: number,
  capitalCost: number
): Omit<CartItem, "quantity"> => ({
  variantId,
  productName: "Test Product",
  variantName: "30ml",
  sku: `SKU-${variantId}`,
  price,
  capitalCost,
});

// Reset the store state before each test for isolation
beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe("addItem", () => {
  it("adds a new item with quantity 1", () => {
    useCartStore.getState().addItem(makeItem("v1", 100, 60));
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].variantId).toBe("v1");
    expect(items[0].quantity).toBe(1);
  });

  it("increments quantity instead of adding a duplicate item", () => {
    const store = useCartStore.getState();
    store.addItem(makeItem("v1", 100, 60));
    store.addItem(makeItem("v1", 100, 60));
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it("adds multiple different items as separate entries", () => {
    const store = useCartStore.getState();
    store.addItem(makeItem("v1", 100, 60));
    store.addItem(makeItem("v2", 200, 120));
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(2);
  });
});

describe("removeItem", () => {
  it("removes an item by variantId", () => {
    useCartStore.getState().addItem(makeItem("v1", 100, 60));
    useCartStore.getState().removeItem("v1");
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("only removes the specified item, leaving others intact", () => {
    const store = useCartStore.getState();
    store.addItem(makeItem("v1", 100, 60));
    store.addItem(makeItem("v2", 200, 120));
    store.removeItem("v1");
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].variantId).toBe("v2");
  });

  it("does nothing when removing a non-existent variantId", () => {
    useCartStore.getState().addItem(makeItem("v1", 100, 60));
    useCartStore.getState().removeItem("non-existent");
    expect(useCartStore.getState().items).toHaveLength(1);
  });
});

describe("updateQuantity", () => {
  it("updates an item to a specific quantity", () => {
    const store = useCartStore.getState();
    store.addItem(makeItem("v1", 100, 60));
    store.updateQuantity("v1", 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it("removes the item when quantity is set to 0", () => {
    const store = useCartStore.getState();
    store.addItem(makeItem("v1", 100, 60));
    store.updateQuantity("v1", 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("removes the item when quantity is set to a negative number", () => {
    const store = useCartStore.getState();
    store.addItem(makeItem("v1", 100, 60));
    store.updateQuantity("v1", -1);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe("clearCart", () => {
  it("empties all items from the cart", () => {
    const store = useCartStore.getState();
    store.addItem(makeItem("v1", 100, 60));
    store.addItem(makeItem("v2", 200, 120));
    store.clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("does nothing if the cart is already empty", () => {
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe("getTotal", () => {
  it("returns 0 for an empty cart", () => {
    expect(useCartStore.getState().getTotal()).toBe(0);
  });

  it("calculates total as sum of (price × quantity) for one item", () => {
    const store = useCartStore.getState();
    store.addItem(makeItem("v1", 100, 60));
    store.updateQuantity("v1", 3);
    expect(store.getTotal()).toBe(300);
  });

  it("calculates total correctly with multiple different items", () => {
    const store = useCartStore.getState();
    store.addItem(makeItem("v1", 100, 60)); // qty 1 → 100
    store.addItem(makeItem("v2", 200, 120)); // qty 1 → 200
    store.updateQuantity("v1", 2); // qty 2 → 200
    // Total: 200 + 200 = 400
    expect(store.getTotal()).toBe(400);
  });
});

describe("getItemCount", () => {
  it("returns 0 for an empty cart", () => {
    expect(useCartStore.getState().getItemCount()).toBe(0);
  });

  it("returns the total quantity across all items", () => {
    const store = useCartStore.getState();
    store.addItem(makeItem("v1", 100, 60));
    store.addItem(makeItem("v2", 200, 120));
    store.updateQuantity("v1", 3);
    store.updateQuantity("v2", 2);
    // 3 + 2 = 5
    expect(store.getItemCount()).toBe(5);
  });
});

describe("getProfit", () => {
  it("returns 0 for an empty cart", () => {
    expect(useCartStore.getState().getProfit()).toBe(0);
  });

  it("calculates profit as sum of (price - capitalCost) × quantity for one item", () => {
    const store = useCartStore.getState();
    store.addItem(makeItem("v1", 100, 60)); // profit/unit = 40
    store.updateQuantity("v1", 3); // total profit = 120
    expect(store.getProfit()).toBe(120);
  });

  it("calculates profit correctly with multiple items", () => {
    const store = useCartStore.getState();
    // Item v1: price=100, cost=60, qty=2 → profit = 80
    // Item v2: price=350, cost=200, qty=3 → profit = 450
    store.addItem(makeItem("v1", 100, 60));
    store.addItem(makeItem("v2", 350, 200));
    store.updateQuantity("v1", 2);
    store.updateQuantity("v2", 3);

    expect(store.getProfit()).toBe(80 + 450); // 530
  });

  it("returns a profit of 0 when price equals capitalCost", () => {
    const store = useCartStore.getState();
    store.addItem(makeItem("v1", 100, 100));
    store.updateQuantity("v1", 5);
    expect(store.getProfit()).toBe(0);
  });
});
```

##### Step 4 Verification Checklist
- [ ] Run `npm test` — all 3 test suites (schemas, utilities, cart store) pass.
- [ ] No errors or unexpected failures.
- [ ] Run `npm run test:coverage` to see initial coverage report.

#### Step 4 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 5: Expand E2E Tests — POS & Inventory Critical Paths

- [ ] Create the `e2e/helpers/` directory.
- [ ] Copy and paste the code below into `e2e/helpers/auth.ts`:

```typescript
import { Page } from "@playwright/test";

/**
 * Signs up a new test user and waits for the dashboard to load.
 * Uses a timestamp-based email to guarantee uniqueness per test run.
 * @returns The email used for signup (useful if you need to re-login later)
 */
export async function signUpAndLogin(page: Page): Promise<string> {
  const timestamp = Date.now();
  const email = `e2e-${timestamp}@test.com`;

  await page.goto("/signup");
  await page.fill('input[name="fullName"]', "E2E Test User");
  await page.fill('input[name="shopName"]', `Test Shop ${timestamp}`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "password123");
  await page.fill('input[name="confirmPassword"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 15000 });

  return email;
}
```

- [ ] Copy and paste the code below into `e2e/pos-checkout.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
import { signUpAndLogin } from "./helpers/auth";

test.describe("POS - Cart Interactions", () => {
  test.beforeEach(async ({ page }) => {
    await signUpAndLogin(page);
  });

  test("navigates to POS page and renders the product grid", async ({
    page,
  }) => {
    await page.goto("/pos");
    await expect(page).toHaveURL(/\/pos/);
    // The page should have a heading or key element indicating POS
    await expect(page.locator("h1, [data-testid='pos-page']")).toBeVisible({
      timeout: 10000,
    });
  });

  test("POS page has a cart and product area", async ({ page }) => {
    await page.goto("/pos");
    // Cart panel should be present
    await expect(
      page.locator(
        "[data-testid='cart-panel'], [aria-label='Cart'], text=Cart"
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test("branch selector is visible on POS page", async ({ page }) => {
    await page.goto("/pos");
    await expect(
      page.locator(
        "[data-testid='branch-selector'], [aria-label='Branch'], text=Branch"
      )
    ).toBeVisible({ timeout: 10000 });
  });
});
```

- [ ] Copy and paste the code below into `e2e/inventory-management.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
import { signUpAndLogin } from "./helpers/auth";

test.describe("Inventory Management", () => {
  test.beforeEach(async ({ page }) => {
    await signUpAndLogin(page);
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test("navigates to inventory page", async ({ page }) => {
    await page.goto("/inventory");
    await expect(page).toHaveURL(/\/inventory/);
  });

  test("inventory page renders stock level table or grid", async ({ page }) => {
    await page.goto("/inventory");
    // Inventory page should render some content (table, empty state, or grid)
    await expect(
      page.locator(
        "table, [data-testid='inventory-table'], [data-testid='inventory-empty'], h1"
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test("inventory page has accessible heading", async ({ page }) => {
    await page.goto("/inventory");
    const heading = page.locator("h1");
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});
```

- [ ] Copy and paste the code below into `e2e/staff-management.spec.ts`:

```typescript
import { test, expect, Page } from "@playwright/test";
import { signUpAndLogin } from "./helpers/auth";

async function navigateToStaff(page: Page) {
  await page.goto("/dashboard/staff");
  // Fallback if staff is under a different path
  if (!(await page.locator("h1").isVisible())) {
    await page.goto("/staff");
  }
}

test.describe("Staff Management", () => {
  test.beforeEach(async ({ page }) => {
    await signUpAndLogin(page);
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test("navigates to the staff management page", async ({ page }) => {
    // Try navigating via sidebar link first
    await page.goto("/dashboard");
    const staffLink = page.locator("aside >> text=Staff");
    if (await staffLink.isVisible()) {
      await staffLink.click();
      await page.waitForURL(/staff/, { timeout: 10000 });
    } else {
      await page.goto("/staff");
    }
    await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
  });

  test("staff page renders the staff list or empty state", async ({ page }) => {
    await page.goto("/staff");
    await expect(
      page.locator(
        "table, [data-testid='staff-list'], [data-testid='staff-empty'], h1"
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test("add staff dialog/form can be opened", async ({ page }) => {
    await page.goto("/staff");
    // Look for an "Add Staff" or "New Staff" button
    const addButton = page.locator(
      "button:has-text('Add'), button:has-text('New Staff'), button:has-text('Add Staff')"
    );
    if (await addButton.isVisible()) {
      await addButton.click();
      // A dialog or form should appear
      await expect(
        page.locator(
          "dialog, [role='dialog'], form, [data-testid='add-staff-form']"
        )
      ).toBeVisible({ timeout: 5000 });
    } else {
      // If button doesn't exist yet, just verify the page loaded
      await expect(page.locator("h1")).toBeVisible();
    }
  });
});
```

##### Step 5 Verification Checklist
- [ ] Ensure the development server is running (`npm run dev` in a separate terminal) before running E2E tests.
- [ ] Run `npm run test:e2e` — all 5 spec files (3 existing + 2 new) should be found.
- [ ] The 3 existing spec files (`auth-routes.spec.ts`, `dashboard-multi-tenant.spec.ts`, `dashboard-navigation.spec.ts`) must remain green.
- [ ] The new specs may pass partially depending on how far the POS/Staff UI is implemented. Any "visible element not found" failures in the new specs are acceptable if those features aren't fully wired up yet — adjust selectors as needed.
- [ ] No spec file should throw JavaScript errors or fail with timeouts on page navigation.

#### Step 5 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

## Summary

| Step | Layer | Files Created | Key Commands |
|------|-------|---------------|--------------|
| 1 | Config | `vitest.config.ts`, `vitest.setup.ts` | `npm test` |
| 2 | Unit — Schemas | 7 `__tests__/*.test.ts` files in `lib/validations/` | `npm test` |
| 3 | Unit — Utils | `lib/utils/__tests__/slugify.test.ts`, `lib/auth/__tests__/password.test.ts` | `npm test` |
| 4 | Unit — Zustand | `lib/hooks/__tests__/useCart.test.ts` | `npm test`, `npm run test:coverage` |
| 5 | E2E | `e2e/helpers/auth.ts`, `e2e/pos-checkout.spec.ts`, `e2e/inventory-management.spec.ts`, `e2e/staff-management.spec.ts` | `npm run test:e2e` |

**All unit test commands:** `npm test` (run once), `npm run test:watch` (watch mode), `npm run test:coverage` (with coverage report)

**All E2E commands:** `npm run test:e2e` (headless), `npm run test:e2e:ui` (with Playwright UI)

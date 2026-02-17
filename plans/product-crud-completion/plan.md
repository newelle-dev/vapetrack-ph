# Product CRUD Completion

**Branch:** `feature/product-crud-operations`
**Description:** Complete product CRUD operations (create, edit, delete) with form validation and UI integration

## Goal

Enable shop owners to create, edit, and delete products through the inventory page UI. This completes the inventory management feature by implementing the missing product CRUD operations while following established patterns from category management.

## Context

**Current State:**
- ✅ Product list page with search/filters fully implemented
- ✅ TanStack Query hooks (`useProducts`, `useProductById`) working
- ✅ Category CRUD fully functional (serves as reference pattern)
- ❌ Product CRUD operations missing (cannot create/edit/delete products)
- ❌ "Create Product" button not wired to any functionality
- ❌ No edit/delete actions in product table

**Key Findings from Research:**
- Database schema supports products + variants (2-table approach)
- ALL products require at least one variant (even single-variant products)
- Prices stored in centavos (integers) to avoid floating-point errors
- Slug auto-generation pattern exists (`slugify` + `generateUniqueSlug`)
- RLS policies handle multi-tenancy automatically
- Soft delete pattern used throughout (set `deleted_at` timestamp)

## Implementation Steps

### Step 1: Create Validation Schemas and Server Actions

**Files:**
- `lib/validations/product.ts` (NEW)
- `app/actions/products.ts` (NEW)

**What:**
Create Zod validation schemas for products and variants, following the category pattern. Implement server actions for:
- `createProduct(data)` - Creates product + mandatory initial variant
- `updateProduct(id, data)` - Updates product base info only (name, brand, description, category, image, status)
- `deleteProduct(id)` - Soft deletes product (sets `deleted_at`)

**Details:**
- `productSchema`: Validates name (2-255 chars), brand (optional), description (optional), category_id (UUID or null), image_url (URL or empty string), is_active (boolean)
- `variantSchema`: Validates variant name, SKU (required, unique per org), selling_price (int cents, ≥0), capital_cost (int cents, ≥0), low_stock_threshold (int, default 10), is_active
- `createProductSchema`: Extends productSchema with `initial_variant` field (variantSchema type)
- Server actions follow auth pattern: extract user → validate input → fetch organization_id → generate slug → insert/update → revalidatePath → return ActionResult
- Slug generation uses `generateUniqueSlug(slugify(productName))`
- Initial variant for new products uses provided SKU (must be unique)

**Testing:**
- Manually test createProduct action by calling from browser console or temporary UI
- Verify product + variant inserted in database
- Verify organization_id filtering (RLS) by checking with multiple test organizations
- Test validation errors (missing required fields, invalid prices)

---

### Step 2: Create Product Form Dialog Component

**Files:**
- `components/inventory/product-form-dialog.tsx` (NEW)

**What:**
Build a dialog-based form component for creating products, following the category-form pattern. Supports:
- Create mode (new product with initial variant)
- Edit mode (update existing product base info only - no variant changes in this step)
- Fields: Product name, brand, description, category dropdown (from useCategories hook), image URL, active status toggle
- Initial variant fields (create mode only): Variant name (default "Standard"), SKU, selling price (₱), capital cost (₱), low stock threshold

**Details:**
- Use `Dialog` from shadcn/ui with controlled `open` state
- Use `react-hook-form` with `zodResolver(createProductSchema)` for create mode
- Use `zodResolver(productSchema)` for edit mode
- Price input fields convert centavos ↔ pesos (e.g., input 450.00 → store as 45000)
- Category dropdown uses `useCategories()` to fetch options (or pass as prop)
- Optional `trigger` prop for custom button (like CategoryForm)
- `initialData` prop determines create vs edit mode
- `useTransition` for pending state during submission
- Toast notifications (sonner) for success/error feedback
- Reset form and close dialog on success

**Testing:**
- Open dialog, fill form, submit → verify product + variant created
- Test validation: empty name, negative prices, invalid URL
- Test category dropdown loads options
- Test price conversion (input ₱450.00 → submit as 45000 centavos)
- Test pending state during submission (button disabled, loading text)

---

### Step 3: Wire Create Button and Add Table Actions

**Files:**
- `app/(dashboard)/inventory/page.tsx` (MODIFY)
- `components/inventory/product-table.tsx` (MODIFY)
- `components/inventory/product-card.tsx` (MODIFY - mobile view)

**What:**
1. Wire "Create Product" button to open ProductFormDialog
2. Add Edit and Delete actions to product table (desktop) and product card (mobile)
3. Edit button opens ProductFormDialog in edit mode
4. Delete button shows confirmation AlertDialog, then calls deleteProduct action

**Details:**
- In `page.tsx`: Import ProductFormDialog, wrap Button in trigger prop
```tsx
<ProductFormDialog
  trigger={
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Create Product
    </Button>
  }
/>
```
- In `product-table.tsx`: Add Actions column with Edit and Delete buttons (follow category-list pattern)
  - Edit: `<ProductFormDialog initialData={product} trigger={<Button variant="ghost" size="icon"><Edit /></Button>} />`
  - Delete: `<AlertDialog>` with confirmation → call `deleteProduct(product.id)` on confirm
- In `product-card.tsx`: Add action buttons (Edit, Delete) to card footer for mobile responsive view
- Use `useTransition` for delete operation loading state
- Toast notifications for delete success/error

**Testing:**
- Click "Create Product" → dialog opens → form works
- Click Edit on a product → dialog opens with pre-filled data → update works
- Click Delete → confirmation shows → confirm → product soft-deleted (disappears from list)
- Test on mobile view (<768px) → actions visible in card view
- Verify list refreshes after create/edit/delete (TanStack Query invalidation + revalidatePath)

---

### Step 4: Integration Testing and Polish

**Files:**
- All files from previous steps (review and refine)
- Optional: Create Playwright E2E test `e2e/product-crud.spec.ts`

**What:**
End-to-end testing of complete product CRUD flow, edge case handling, and UI polish.

**Test Cases:**
1. **Happy Path:**
   - Create product with all fields + initial variant
   - Edit product (change name, category)
   - Delete product → confirm removed from list
   
2. **Validation:**
   - Try submitting empty form → validation errors show
   - Enter negative prices → blocked
   - Enter invalid image URL → validation error
   
3. **Edge Cases:**
   - Create product with duplicate SKU → error handled gracefully
   - Create product with same name → slug uniqueness ensures no conflict
   - Delete product → verify variants also soft-deleted (cascade check)
   
4. **Multi-Tenancy:**
   - Login as Org A → create product
   - Login as Org B → verify Org A's product not visible
   
5. **Mobile Responsive:**
   - Test on mobile viewport (375px width)
   - Verify form dialogs scroll properly
   - Confirm action buttons accessible on cards

**Polish:**
- Add loading skeletons during data fetch
- Ensure error messages are user-friendly
- Verify mobile form layout (fields stack properly)
- Check accessibility (keyboard navigation, ARIA labels)

**Testing:**
- Manual testing on both desktop and mobile viewports
- Optional: Write Playwright test for full flow (create → edit → delete)
- Verify with 2+ test organizations for RLS isolation

---

## Definition of Done

- [ ] Can create products with initial variant through UI
- [ ] Can edit product base info (name, brand, category, etc.)
- [ ] Can delete products (soft delete with confirmation)
- [ ] All validation works (required fields, price formats, SKU uniqueness)
- [ ] Form shows clear error messages for invalid input
- [ ] Loading states display during async operations
- [ ] Toast notifications provide feedback for all actions
- [ ] Product list refreshes automatically after mutations
- [ ] Mobile-responsive (forms and actions work on small screens)
- [ ] Multi-tenant isolation verified (Org A can't see/edit Org B's products)
- [ ] Edit/Delete actions visible in both table (desktop) and card (mobile) views

## Out of Scope (Future Enhancements)

- Variant management UI (add/edit/delete variants for existing products) - requires separate component
- Image upload functionality (currently only URL input)
- Bulk import/export
- Product history/audit log
- Inventory stock management integration
- Barcode generation/scanning

## Notes

- Follow category CRUD pattern closely ([app/actions/categories.ts](app/actions/categories.ts), [components/categories/category-form.tsx](components/categories/category-form.tsx))
- Always use `revalidatePath('/inventory')` in server actions
- Store prices as integers (centavos) to avoid floating-point errors
- Use `formatCurrency()` utility for display (e.g., 45000 → "₱450.00")
- Generate unique slugs with `generateUniqueSlug(slugify(name))`
- Soft delete: set `deleted_at` timestamp, never hard delete
- RLS handles multi-tenancy - no manual `organization_id` filters needed

## Open Questions

**Q: Should product creation support multiple initial variants?**
→ [NEEDS CLARIFICATION] Current plan requires exactly one initial variant (simplest approach). Multi-variant creation could be added later or in variant manager component.

**Q: Should we allow editing product if it has sales history?**
→ [NEEDS CLARIFICATION] Current plan allows unrestricted editing. Consider adding warning if product has transaction history, or lock critical fields (name, category).

**Q: Price input format preference?**
→ [NEEDS CLARIFICATION] Should users input prices as ₱450.00 (peso format with conversion to centavos on submit) or as integer centavos (45000)? Peso format is more user-friendly.

**Q: Category dropdown: Show all categories or only root categories?**
→ [NEEDS CLARIFICATION] Current filters show only root categories (`parent_id IS NULL`). Should product assignment support subcategories?

**Q: Image URL input vs file upload?**
→ Current plan uses URL input (simpler). File upload requires storage setup (Supabase Storage). Is URL-only acceptable for MVP?

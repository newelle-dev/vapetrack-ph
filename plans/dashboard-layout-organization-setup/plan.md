# Dashboard Layout & Organization Setup

**Branch:** `feature/dashboard-layout-org-setup`
**Description:** Implement responsive dashboard layout with navigation, organization settings, and branch management

## Goal

Create a production-ready dashboard layout with mobile-first responsive navigation, organization settings management, and branch CRUD operations. This establishes the foundation for all future dashboard features while strictly following multi-tenant RLS patterns and the VapeTrack PH design system.

## Implementation Steps

### Step 1: Dashboard Layout Foundation

**Files:**

- `app/(dashboard)/layout.tsx` (create)
- `components/layouts/Sidebar.tsx` (create)
- `components/layouts/MobileNav.tsx` (create)
- `components/layouts/Header.tsx` (create)
- `components/ui/sheet.tsx` (install via shadcn)
- `components/ui/navigation-menu.tsx` (install via shadcn)
- `components/ui/avatar.tsx` (install via shadcn)
- `components/ui/dropdown-menu.tsx` (install via shadcn)

**What:**
Implement responsive dashboard layout with authentication protection, desktop sidebar navigation, mobile bottom navigation, and user dropdown menu in header. Layout checks user authentication and redirects to /login if not authenticated. Navigation includes: Dashboard, POS, Inventory, Branches, Reports, Settings. Mobile uses bottom navigation (60px height, 44×44px touch targets) and hamburger menu in header. Desktop displays fixed sidebar (240px width) with main content area.

**Testing:**

1. Run dev server and navigate to /dashboard while logged out - should redirect to /login
2. Log in and verify dashboard layout renders
3. Test responsive behavior:
   - Mobile (375px): Bottom nav visible, sidebar hidden, hamburger menu in header
   - Desktop (1024px+): Sidebar visible, bottom nav hidden
4. Click all navigation items - routes should change
5. Click user dropdown - should show "Settings" and "Logout" options
6. Click "Logout" - should redirect to /login

**Key Implementation Notes:**

- Use Server Component for layout.tsx with `createClient()` from `@/lib/supabase/server`
- Authentication check pattern:
  ```typescript
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  ```
- Get user profile with organization using join pattern from dashboard/page.tsx
- **Permission-based navigation**: Hide menu items based on user role and permissions
  ```typescript
  // Only show if user.role === 'owner'
  { label: 'Branches', show: profile.role === 'owner' }
  // Only show if can_manage_inventory
  { label: 'Inventory', show: profile.can_manage_inventory }
  ```
- Use Lucide React icons: Home, ShoppingCart, Package, Building2, BarChart3, Settings
- Dark mode classes (already configured in root layout)
- Mobile nav: `fixed bottom-0 inset-x-0 z-50` with 60px height
- Sidebar: `fixed left-0 top-0 h-screen w-60` for desktop, hidden on mobile
- User dropdown in header: Avatar + full name + dropdown (Settings link, Logout button)

---

### Step 2: Organization Settings Page

**Files:**

- `app/(dashboard)/settings/page.tsx` (create)
- `app/actions/organizations.ts` (create)
- `lib/validations/organization.ts` (create)

**What:**
Create organization settings page that displays current organization details (name, slug, owner email, address, phone) and allows editing of mutable fields (name, address, phone). Implement Zod validation schema and Server Action for updating organization data. Use react-hook-form with optimistic UI updates and toast notifications.

**Testing:**

1. Navigate to /dashboard/settings
2. Verify organization details display correctly
3. Edit organization name, address, and phone
4. Submit form - should show success toast and update display
5. Refresh page - changes should persist
6. Try invalid input (e.g., empty name) - should show validation errors
7. Test with slow network (DevTools throttling) - should show loading state

**Key Implementation Notes:**

- Server Component for initial data load (fetch organization via RLS-filtered query)
- Client Component for form (use 'use client' directive)
- Validation schema in `lib/validations/organization.ts`:
  ```typescript
  export const organizationUpdateSchema = z.object({
    name: z.string().min(2, "Shop name must be at least 2 characters"),
    address: z.string().optional(),
    phone: z.string().optional(),
  });
  ```
- Server Action pattern:
  ```typescript
  "use server";
  export async function updateOrganization(data: OrganizationUpdateInput) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // RLS automatically filters to user's organization
    const { error } = await supabase
      .from("organizations")
      .update({ name: data.name, address: data.address, phone: data.phone })
      .eq("owner_email", user.email);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/settings");
    return { success: true };
  }
  ```
- Display read-only fields: slug, owner_email, subscription_status, created_at
- Use Card component for layout, Form components for inputs
- Toast notifications: `toast.success('Organization updated')` on success

---

### Step 3: Branch Management Page

**Files:**

- `app/(dashboard)/branches/page.tsx` (create)
- `app/actions/branches.ts` (create)
- `lib/validations/branch.ts` (create)
- `components/ui/table.tsx` (install via shadcn)
- `components/ui/badge.tsx` (install via shadcn)
- `components/ui/alert-dialog.tsx` (install via shadcn - for delete confirmation)

**What:**
Create branch management page that lists all branches for the organization, shows branch details (name, address, phone, is_default, is_active), and provides forms to add, edit, and delete branches. Implement validation to ensure only one default branch exists per organization and prevent deletion of the default branch. Use Dialog component for add/edit forms and AlertDialog for delete confirmation.

**Testing:**

1. Navigate to /branches
2. Verify at least one branch exists (the default branch created during signup)
3. Click "Add Branch" - dialog should open with form
4. Create new branch with name "Test Branch" - should appear in list
5. Click "Edit" on a branch - dialog should open with pre-filled form
6. Update branch details - should save and update list
7. Try to set two branches as default - should show error
8. Test branch activation toggle (is_active field)
9. Click "Delete" on non-default branch - should show confirmation dialog
10. Confirm deletion - branch should be removed from list
11. Try to delete default branch - should show error "Cannot delete default branch"
12. Sign up second account - verify branches are isolated (each org sees only their branches)

**Key Implementation Notes:**

- Server Component for initial branch list fetch
- Client Component for interactive table and dialogs
- Validation schema in `lib/validations/branch.ts`:
  ```typescript
  export const branchCreateSchema = z.object({
    name: z.string().min(2, "Branch name required"),
    address: z.string().optional(),
    phone: z.string().optional(),
    is_default: z.boolean().default(false),
    is_active: z.boolean().default(true),
  });
  ```
- Server Actions in `app/actions/branches.ts`:
  ```typescript
  export async function createBranch(data: BranchInput);
  export async function updateBranch(id: string, data: BranchInput);
  export async function deleteBranch(id: string); // With default branch check
  ```
- Default branch validation: Before setting is_default=true, check if another default exists
- Delete branch validation: Prevent deletion if is_default=true
- Use `generateUniqueSlug()` from `lib/utils/slugify.ts` for branch slugs
- Display branches in Table with columns: Name, Address, Phone, Status (Active/Inactive badge), Default (badge), Actions (Edit button, Delete button)
- Use Dialog component for add/edit forms
- Use AlertDialog component for delete confirmation with warning message
- RLS automatically filters branches by organization_id - no manual filtering needed

---

### Step 4: Multi-Tenant Testing & Polish

**Files:**

- `e2e/dashboard-multi-tenant.spec.ts` (create)
- `e2e/dashboard-navigation.spec.ts` (create)
- `playwright.config.ts` (update if needed)

**What:**
Create automated Playwright E2E tests for multi-tenant isolation and navigation behavior. Tests verify complete data segregation between organizations, permission-based navigation hiding, and responsive navigation behavior. Also perform manual polish testing for error handling, loading states, and accessibility.

**Testing:**

1. **Automated E2E Tests (Playwright):**
   - `e2e/dashboard-multi-tenant.spec.ts`:
     - Test: Sign up 2 orgs, create branches, verify isolation
     - Test: Organization settings only show own data
     - Test: Branches only show own data
   - `e2e/dashboard-navigation.spec.ts`:
     - Test: Owner sees all navigation items
     - Test: Staff sees limited navigation based on permissions
     - Test: Navigation items link to correct routes
   - Run with: `npm run test:e2e`

2. **Responsive Testing:**
   - Test at 375px (iPhone SE), 768px (iPad), 1024px (Desktop)
   - Verify touch targets ≥ 44×44px on mobile
   - Test hamburger menu on mobile (sheet should slide in/out)
   - Test bottom nav on mobile (should be fixed at bottom)
   - Test sidebar on desktop (should be fixed on left)

3. **Error Handling:**
   - Test form validation errors (empty required fields)
   - Test network errors (DevTools offline mode)
   - Verify toast notifications appear and auto-dismiss

4. **Accessibility:**
   - Tab through navigation - focus indicators visible
   - Screen reader announces page title changes
   - ARIA labels on icon-only buttons

**Key Implementation Notes:**

- E2E test patterns:
  ```typescript
  test("multi-tenant isolation", async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    // Sign up Org A, create data

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    // Sign up Org B, verify no Org A data visible
  });
  ```
- Manual testing checklist:
  - Chrome DevTools device emulation for responsive testing
  - Test on real mobile device if available (preferably Android on 4G)
  - Verify no console errors or warnings
  - Check Network tab for unnecessary re-fetches
- Final polish:
  - Add loading skeletons to forms
  - Add empty states ("No branches yet" message)
  - Ensure all buttons have proper disabled states during loading
  - Verify all forms reset after successful submission
  - Test delete confirmation dialog on mobile (readable and accessible)

---

## Design Specifications

### Navigation Items

| Icon         | Label     | Route                  | Role Access          |
| ------------ | --------- | ---------------------- | -------------------- |
| Home         | Dashboard | `/dashboard`           | All                  |
| ShoppingCart | POS       | `/pos`       | All                  |
| Package      | Inventory | `/inventory` | can_manage_inventory |
| Building2    | Branches  | `/branches`  | Owner                |
| BarChart3    | Reports   | `/reports`   | can_view_reports     |
| Settings     | Settings  | `/settings`  | Owner                |

### Responsive Breakpoints

- **Mobile**: < 768px - Bottom nav + hamburger menu
- **Tablet**: 768px - 1023px - Bottom nav + hamburger menu
- **Desktop**: ≥ 1024px - Fixed sidebar + no bottom nav

### Color Tokens (Tailwind Dark Mode)

- Background: `bg-background` (black)
- Card background: `bg-card` (slate-800)
- Text primary: `text-foreground` (slate-50)
- Border: `border-border` (slate-700)
- Primary button: `bg-primary` (green-500)

### Touch Target Sizes

- Minimum: 44×44px
- Navigation items: 48×48px
- Buttons: h-10 (40px) minimum, h-11 (44px) preferred

---

## Dependencies to Install

```bash
# shadcn/ui components
npx shadcn@latest add sheet
npx shadcn@latest add navigation-menu
npx shadcn@latest add avatar
npx shadcn@latest add dropdown-menu
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add alert-dialog
```

---

## Success Criteria

- [ ] Authentication check in dashboard layout redirects unauthenticated users
- [ ] Desktop sidebar displays all navigation items and user dropdown
- [ ] Mobile bottom nav displays with 44×44px touch targets
- [ ] Mobile hamburger menu opens sheet with navigation
- [ ] Organization settings page displays and updates organization data
- [ ] Branch management page lists, adds, edits, and deletes branches
- [ ] Branch deletion prevented for default branch
- [ ] Multi-tenant test passes: 2 orgs see completely separate data
- [ ] Playwright E2E tests pass (multi-tenant + navigation)
- [ ] Permission-based navigation verified (staff see limited menu)
- [ ] Responsive behavior verified at 375px, 768px, 1024px widths
- [ ] No console errors or TypeScript errors
- [ ] All forms validated with Zod schemas
- [ ] Toast notifications appear on success/error
- [ ] Loading states display during async operations
- [ ] `npm run build` succeeds without errors

---

## Notes & Constraints

1. **RLS Trust**: Never add manual `WHERE organization_id = X` filters - RLS policies handle this automatically
2. **Server Components Default**: Use Server Components for data fetching, Client Components only for interactivity
3. **Mobile-First**: Design at 375px first, then scale up to desktop
4. **Dark Mode**: Already configured with `className="dark"` in root layout
5. **Icon Library**: Use Lucide React (already installed)
6. **State Management**: Use TanStack Query for future features; this sprint uses Server Components + Server Actions
7. **Form Library**: react-hook-form with Zod resolver (pattern established in auth pages)
8. **Error Pattern**: All Server Actions return `{ success: boolean, error?: string, data?: T }`

---

## Future Enhancements (Out of Scope for Day 6-7)

- Organization logo upload
- Branch-specific settings
- Real-time updates with Supabase subscriptions
- Advanced permissions (branch-level access control)
- Organization members management

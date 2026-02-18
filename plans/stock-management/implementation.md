# Stock Management & Adjustments — Implementation

## Goal
Implement inventory stock view page with color-coded levels, quick stock adjustments via a Postgres RPC function, stock movement history page, and full audit trail.

## Prerequisites
Make sure that you are currently on the `feat/stock-management` branch before beginning implementation.
If not, move to the correct branch. If the branch does not exist, create it from main.

---

### Step-by-Step Instructions

---

#### Step 1: Database — Create `adjust_stock` Postgres Function

- [x] Create the migration file `migrations/004_stock_functions.sql`:

```sql
-- Migration: 004_stock_functions.sql
-- Description: Create adjust_stock RPC function for atomic stock adjustments

-- ─── adjust_stock RPC ───────────────────────────────────────────────────────────
-- Atomically adjusts inventory quantity and creates a stock_movements audit record.
-- Uses SECURITY DEFINER so the function can update inventory and insert stock_movements
-- regardless of the caller's RLS policies.
-- Uses SELECT ... FOR UPDATE to prevent concurrent race conditions.

CREATE OR REPLACE FUNCTION public.adjust_stock(
  p_variant_id   UUID,
  p_branch_id    UUID,
  p_quantity     INTEGER,
  p_movement_type TEXT,
  p_reason       TEXT DEFAULT NULL,
  p_user_id      UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_qty   INTEGER;
  v_new_qty       INTEGER;
  v_inventory_id  UUID;
  v_org_id        UUID;
BEGIN
  -- Validate movement_type
  IF p_movement_type NOT IN ('stock_in', 'stock_out', 'adjustment') THEN
    RAISE EXCEPTION 'Invalid movement_type: %. Must be stock_in, stock_out, or adjustment.', p_movement_type;
  END IF;

  -- Validate quantity is positive
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than 0.';
  END IF;

  -- Lock the inventory row to prevent concurrent modifications
  SELECT id, quantity, organization_id
    INTO v_inventory_id, v_current_qty, v_org_id
    FROM inventory
   WHERE product_variant_id = p_variant_id
     AND branch_id = p_branch_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory record not found for variant % at branch %.', p_variant_id, p_branch_id;
  END IF;

  -- Calculate new quantity based on movement type
  IF p_movement_type = 'stock_in' THEN
    v_new_qty := v_current_qty + p_quantity;
  ELSIF p_movement_type = 'stock_out' THEN
    v_new_qty := v_current_qty - p_quantity;
  ELSIF p_movement_type = 'adjustment' THEN
    -- adjustment: p_quantity is the absolute target value
    v_new_qty := p_quantity;
  END IF;

  -- Prevent negative stock
  IF v_new_qty < 0 THEN
    RAISE EXCEPTION 'Insufficient stock. Current: %, requested removal: %. Stock cannot go below 0.', v_current_qty, p_quantity;
  END IF;

  -- Update inventory
  UPDATE inventory
     SET quantity   = v_new_qty,
         updated_at = NOW()
   WHERE id = v_inventory_id;

  -- Insert audit record
  INSERT INTO stock_movements (
    organization_id,
    branch_id,
    product_variant_id,
    quantity_change,
    quantity_before,
    quantity_after,
    movement_type,
    user_id,
    notes
  ) VALUES (
    v_org_id,
    p_branch_id,
    p_variant_id,
    CASE
      WHEN p_movement_type = 'stock_in'  THEN  p_quantity
      WHEN p_movement_type = 'stock_out' THEN -p_quantity
      WHEN p_movement_type = 'adjustment' THEN v_new_qty - v_current_qty
    END,
    v_current_qty,
    v_new_qty,
    p_movement_type,
    p_user_id,
    p_reason
  );

  RETURN v_new_qty;
END;
$$;

-- Grant execute to authenticated users (RLS still applies via the function's internal logic)
GRANT EXECUTE ON FUNCTION public.adjust_stock(UUID, UUID, INTEGER, TEXT, TEXT, UUID) TO authenticated;
```

- [x] Apply this migration to the Supabase project (via Supabase dashboard SQL editor or `supabase db push`).

##### Step 1 Verification Checklist
- [x] No migration errors
- [x] Verify via SQL: `SELECT adjust_stock('<variant_id>', '<branch_id>', 5, 'stock_in', 'test', '<user_id>')` returns the new quantity
- [x] Verify the `stock_movements` table has a new row with correct `quantity_before`, `quantity_after`, `quantity_change`
- [x] Verify negative stock is rejected: `SELECT adjust_stock('<variant_id>', '<branch_id>', 99999, 'stock_out', 'test', '<user_id>')` raises an exception

#### Step 1 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 2: Server Actions & Validation — `adjustStock()` + Types

- [x] Create the validation schema `lib/validations/inventory.ts`
- [x] Add inventory-related types to `types/index.ts`
- [x] Create the server actions file `app/actions/inventory.ts`

##### Step 2 Verification Checklist
- [x] No TypeScript build errors: `npx tsc --noEmit` passes
- [x] Import paths resolve correctly
- [x] Types are properly exported from `types/index.ts`

#### Step 2 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 3: Stock View Page — Inventory Overview with Color-Coded Levels

This step creates 5 files. Follow the order below.

- [x] Create `components/inventory/stock-variant-row.tsx`:

```tsx
"use client";

import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InventoryItem } from "@/types";

interface StockVariantRowProps {
  item: InventoryItem;
  onAdjust: (item: InventoryItem, type: "stock_in" | "stock_out") => void;
}

function getStockStatus(quantity: number, threshold: number | null) {
  if (quantity === 0) return "out";
  if (threshold !== null && quantity <= threshold) return "low";
  return "sufficient";
}

function getStockBadgeClasses(status: "out" | "low" | "sufficient") {
  switch (status) {
    case "out":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    case "low":
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    case "sufficient":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  }
}

function getStockLabel(status: "out" | "low" | "sufficient") {
  switch (status) {
    case "out":
      return "Out of Stock";
    case "low":
      return "Low Stock";
    case "sufficient":
      return "In Stock";
  }
}

export function StockVariantRow({ item, onAdjust }: StockVariantRowProps) {
  const status = getStockStatus(item.quantity, item.low_stock_threshold);
  const badgeClasses = getStockBadgeClasses(status);
  const label = getStockLabel(status);

  return (
    <div className="flex items-center justify-between gap-3 py-3 px-4 border-b border-border/30 last:border-b-0 hover:bg-secondary/30 transition-colors">
      {/* Variant Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {item.variant_name}
        </p>
        <p className="text-xs text-muted-foreground">
          SKU: {item.sku}
        </p>
      </div>

      {/* Stock Badge */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums",
              badgeClasses
            )}
          >
            {item.quantity}
          </span>
          <p className="text-[10px] text-muted-foreground mt-0.5 text-center">
            {label}
          </p>
        </div>

        {/* Quick Adjust Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300"
            onClick={() => onAdjust(item, "stock_in")}
            aria-label={`Add stock for ${item.variant_name}`}
          >
            <Plus className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-red-400 hover:bg-red-500/15 hover:text-red-300"
            onClick={() => onAdjust(item, "stock_out")}
            aria-label={`Remove stock for ${item.variant_name}`}
          >
            <Minus className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [x] Create `components/inventory/stock-product-group.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { StockVariantRow } from "./stock-variant-row";
import type { StockGroupedByProduct, InventoryItem } from "@/types";

interface StockProductGroupProps {
  group: StockGroupedByProduct;
  onAdjust: (item: InventoryItem, type: "stock_in" | "stock_out") => void;
}

export function StockProductGroup({ group, onAdjust }: StockProductGroupProps) {
  const [isOpen, setIsOpen] = useState(true);

  const totalStock = group.variants.reduce((sum, v) => sum + v.quantity, 0);
  const hasLowStock = group.variants.some(
    (v) =>
      v.low_stock_threshold !== null &&
      v.quantity > 0 &&
      v.quantity <= v.low_stock_threshold
  );
  const hasOutOfStock = group.variants.some((v) => v.quantity === 0);

  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden hover:border-border transition-colors">
      {/* Product Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-secondary/30 transition-colors touch-target"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
            <Package className="size-4 text-primary" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {group.product_name}
            </p>
            {group.brand && (
              <p className="text-xs text-muted-foreground">{group.brand}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Status indicators */}
          {hasOutOfStock && (
            <span className="w-2 h-2 rounded-full bg-red-400" title="Out of stock" />
          )}
          {hasLowStock && (
            <span className="w-2 h-2 rounded-full bg-yellow-400" title="Low stock" />
          )}

          {/* Total stock summary */}
          <span className="text-xs text-muted-foreground tabular-nums">
            {totalStock} total
          </span>

          <span className="text-xs text-muted-foreground">
            ({group.variants.length} {group.variants.length === 1 ? "variant" : "variants"})
          </span>

          {isOpen ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Variant Rows */}
      {isOpen && (
        <div className="border-t border-border/30">
          {group.variants.map((item) => (
            <StockVariantRow
              key={`${item.variant_id}-${item.branch_id || "all"}`}
              item={item}
              onAdjust={onAdjust}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [x] Create `components/inventory/stock-adjustment-dialog.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adjustStock } from "@/app/actions/inventory";
import type { InventoryItem, Branch } from "@/types";

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  initialType: "stock_in" | "stock_out";
  branches: Branch[];
  preSelectedBranchId?: string | null;
  onSuccess: () => void;
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  item,
  initialType,
  branches,
  preSelectedBranchId,
  onSuccess,
}: StockAdjustmentDialogProps) {
  const [quantity, setQuantity] = useState("");
  const [movementType, setMovementType] = useState<"stock_in" | "stock_out">(
    initialType
  );
  const [branchId, setBranchId] = useState(preSelectedBranchId || "");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setQuantity("");
      setMovementType(initialType);
      setBranchId(preSelectedBranchId || "");
      setReason("");
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = () => {
    if (!item) return;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid positive quantity.");
      return;
    }

    if (!branchId) {
      toast.error("Please select a branch.");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason.");
      return;
    }

    startTransition(async () => {
      const result = await adjustStock({
        variant_id: item.variant_id,
        branch_id: branchId,
        quantity: qty,
        movement_type: movementType,
        reason: reason.trim(),
      });

      if (result.success) {
        toast.success(
          `Stock ${movementType === "stock_in" ? "added" : "removed"} successfully. New quantity: ${result.data?.newQuantity}`
        );
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error || "Failed to adjust stock.");
      }
    });
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {movementType === "stock_in" ? "Add Stock" : "Remove Stock"}
          </DialogTitle>
          <DialogDescription>
            {item.product_name} — {item.variant_name} (SKU: {item.sku})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Branch Selector */}
          <div className="space-y-2">
            <Label htmlFor="branch-select">Branch *</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="w-full" id="branch-select">
                <SelectValue placeholder="Select a branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                    {branch.is_default ? " (Default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Movement Type */}
          <div className="space-y-2">
            <Label htmlFor="movement-type">Action</Label>
            <Select
              value={movementType}
              onValueChange={(v) =>
                setMovementType(v as "stock_in" | "stock_out")
              }
            >
              <SelectTrigger className="w-full" id="movement-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stock_in">
                  ➕ Add Stock (Stock In)
                </SelectItem>
                <SelectItem value="stock_out">
                  ➖ Remove Stock (Stock Out)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity-input">Quantity *</Label>
            <Input
              id="quantity-input"
              type="number"
              min="1"
              step="1"
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason-input">Reason *</Label>
            <Textarea
              id="reason-input"
              placeholder="e.g., Restocked from supplier, Damaged items removed..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className={
              movementType === "stock_out"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : ""
            }
          >
            {isPending
              ? "Processing..."
              : movementType === "stock_in"
                ? "Add Stock"
                : "Remove Stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [x] Create `components/inventory/stock-list-client.tsx`:

```tsx
"use client";

import { useState, useMemo } from "react";
import { Package, AlertTriangle, XCircle } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StockProductGroup } from "./stock-product-group";
import { StockAdjustmentDialog } from "./stock-adjustment-dialog";
import type {
  StockGroupedByProduct,
  InventoryItem,
  Branch,
} from "@/types";

interface StockListClientProps {
  initialData: StockGroupedByProduct[];
  branches: Branch[];
}

export function StockListClient({
  initialData,
  branches,
}: StockListClientProps) {
  const [search, setSearch] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [data, setData] = useState(initialData);

  // Adjustment dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<
    "stock_in" | "stock_out"
  >("stock_in");

  // Filter data by search term
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const term = search.toLowerCase();
    return data
      .map((group) => ({
        ...group,
        variants: group.variants.filter(
          (v) =>
            v.variant_name.toLowerCase().includes(term) ||
            v.sku.toLowerCase().includes(term) ||
            v.product_name.toLowerCase().includes(term)
        ),
      }))
      .filter((group) => group.variants.length > 0);
  }, [data, search]);

  // Summary stats
  const stats = useMemo(() => {
    const allVariants = data.flatMap((g) => g.variants);
    return {
      totalProducts: data.length,
      lowStock: allVariants.filter(
        (v) =>
          v.low_stock_threshold !== null &&
          v.quantity > 0 &&
          v.quantity <= v.low_stock_threshold
      ).length,
      outOfStock: allVariants.filter((v) => v.quantity === 0).length,
    };
  }, [data]);

  const handleAdjust = (
    item: InventoryItem,
    type: "stock_in" | "stock_out"
  ) => {
    setSelectedItem(item);
    setAdjustmentType(type);
    setDialogOpen(true);
  };

  const handleAdjustmentSuccess = () => {
    // Trigger a full page reload to re-fetch server component data
    window.location.reload();
  };

  const handleBranchChange = async (value: string) => {
    setSelectedBranchId(value);
    // Fetch new data for the selected branch via dynamic import of the server action
    const { getInventoryWithProducts } = await import(
      "@/app/actions/inventory"
    );
    const branchId = value === "all" ? undefined : value;
    const newData = await getInventoryWithProducts(branchId);
    setData(newData);
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border border-border/50 p-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Package className="size-4 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground tabular-nums">
            {stats.totalProducts}
          </p>
          <p className="text-xs text-muted-foreground">Products</p>
        </div>
        <div className="bg-card rounded-xl border border-yellow-500/30 p-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <AlertTriangle className="size-4 text-yellow-400" />
          </div>
          <p className="text-xl font-bold text-yellow-400 tabular-nums">
            {stats.lowStock}
          </p>
          <p className="text-xs text-muted-foreground">Low Stock</p>
        </div>
        <div className="bg-card rounded-xl border border-red-500/30 p-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <XCircle className="size-4 text-red-400" />
          </div>
          <p className="text-xl font-bold text-red-400 tabular-nums">
            {stats.outOfStock}
          </p>
          <p className="text-xs text-muted-foreground">Out of Stock</p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by product, variant, or SKU..."
          className="flex-1"
        />
        <Select value={selectedBranchId} onValueChange={handleBranchChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Groups */}
      {filteredData.length > 0 ? (
        <div className="space-y-3">
          {filteredData.map((group) => (
            <StockProductGroup
              key={group.product_id}
              group={group}
              onAdjust={handleAdjust}
            />
          ))}
        </div>
      ) : (
        <div className="border border-border/50 rounded-xl p-12 text-center">
          <Package className="size-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {search
              ? "No products match your search."
              : "No inventory records found. Add products first."}
          </p>
        </div>
      )}

      {/* Adjustment Dialog */}
      <StockAdjustmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        initialType={adjustmentType}
        branches={branches}
        preSelectedBranchId={
          selectedBranchId !== "all" ? selectedBranchId : null
        }
        onSuccess={handleAdjustmentSuccess}
      />
    </div>
  );
}
```

- [x] Create the stock page `app/(dashboard)/inventory/stock/page.tsx`:

```tsx
import { PageContainer } from "@/components/layouts/page-container";
import {
  getInventoryWithProducts,
  getBranches,
} from "@/app/actions/inventory";
import { StockListClient } from "@/components/inventory/stock-list-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

export default async function StockPage() {
  const [inventoryData, branches] = await Promise.all([
    getInventoryWithProducts(),
    getBranches(),
  ]);

  return (
    <PageContainer
      title="Stock Levels"
      subtitle="View and manage inventory across branches"
      action={
        <Button variant="outline" size="sm" asChild>
          <Link href="/inventory/history">
            <History className="mr-2 h-4 w-4" />
            History
          </Link>
        </Button>
      }
    >
      <StockListClient initialData={inventoryData} branches={branches} />
    </PageContainer>
  );
}
```

##### Step 3 Verification Checklist
- [x] No build errors
- [x] Navigate to `/inventory/stock` → see all products grouped with variants and stock levels
- [x] Color badges match stock levels (green/yellow/red based on `low_stock_threshold`)
- [x] Click "+" on a variant → dialog opens with "Add Stock" pre-selected
- [x] Click "−" on a variant → dialog opens with "Remove Stock" pre-selected
- [x] Submit adjustment → stock level updates, toast shows success
- [x] Try to remove more than available → error toast "Insufficient stock"
- [x] Search filters products/variants in real-time
- [x] Branch filter dropdown switches between "All Branches" (aggregated) and specific branch
- [x] Summary stats (Products, Low Stock, Out of Stock) are accurate
- [x] Empty state shows when no inventory records exist
- [x] Mobile responsive — stacked cards look good on small screens

#### Step 3 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 4: Stock Movement History Page

This step creates 4 files.

- [x] Create the TanStack Query hook `lib/hooks/useStockHistory.ts`
- [x] Create `components/inventory/stock-history-filters.tsx`
- [x] Create `components/inventory/stock-history-client.tsx`
- [x] Create the history page `app/(dashboard)/inventory/history/page.tsx`

##### Step 4 Verification Checklist
- [x] No build errors
- [x] Navigate to `/inventory/history` → see all stock movements
- [x] Filter by movement type → correct filtering
- [x] Filter by date range → correct results
- [x] Search by product name or SKU → correct filtering
- [x] Recent adjustments from Step 3 appear in history
- [x] Movement type badges have correct colors (green=stock_in, red=stock_out, yellow=adjustment, blue=sale)
- [x] Relative timestamps show correctly ("Just now", "5m ago", etc.)
- [x] Pagination works correctly
- [x] Mobile responsive — card view looks good on small screens
- [x] "Stock Levels" back-link navigates correctly

#### Step 4 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

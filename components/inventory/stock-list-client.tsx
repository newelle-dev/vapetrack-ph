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

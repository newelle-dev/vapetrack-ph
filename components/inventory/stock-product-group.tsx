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
                className="flex items-center justify-between w-full px-4 py-3 hover:bg-secondary/30 transition-colors touch-target group"
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
                        <ChevronDown className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    ) : (
                        <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
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

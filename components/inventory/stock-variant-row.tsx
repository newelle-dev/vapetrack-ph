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

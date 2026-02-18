"use client";

import { useState } from "react";
import {
    useStockHistory,
    type StockHistoryFilters,
    type StockMovementRecord,
} from "@/lib/hooks/useStockHistory";
import { StockHistoryFiltersComponent } from "./stock-history-filters";
import { PaginationControls } from "./pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, RefreshCw, ShoppingCart, PackagePlus } from "lucide-react";

function getMovementIcon(type: string) {
    switch (type) {
        case "stock_in":
            return <ArrowUpRight className="size-4 text-emerald-400" />;
        case "stock_out":
            return <ArrowDownRight className="size-4 text-red-400" />;
        case "adjustment":
            return <RefreshCw className="size-4 text-yellow-400" />;
        case "sale":
            return <ShoppingCart className="size-4 text-blue-400" />;
        case "initial_stock":
            return <PackagePlus className="size-4 text-primary" />;
        default:
            return <RefreshCw className="size-4 text-muted-foreground" />;
    }
}

function getMovementBadgeClasses(type: string) {
    switch (type) {
        case "stock_in":
            return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
        case "stock_out":
            return "bg-red-500/15 text-red-400 border-red-500/30";
        case "adjustment":
            return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
        case "sale":
            return "bg-blue-500/15 text-blue-400 border-blue-500/30";
        case "initial_stock":
            return "bg-primary/15 text-primary border-primary/30";
        default:
            return "bg-secondary text-secondary-foreground border-border";
    }
}

function formatMovementType(type: string) {
    return type
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

function formatRelativeTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
}

function formatAbsoluteTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

function MovementCard({ record }: { record: StockMovementRecord }) {
    return (
        <div className="bg-card rounded-xl border border-border/50 p-4 hover:border-border transition-colors">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 shrink-0">{getMovementIcon(record.movement_type)}</div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                            {record.product_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {record.variant_name} • {record.variant_sku}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {record.branch_name}
                        </p>
                    </div>
                </div>

                <div className="text-right shrink-0">
                    <span
                        className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums",
                            record.quantity_change > 0
                                ? "text-emerald-400"
                                : record.quantity_change < 0
                                    ? "text-red-400"
                                    : "text-muted-foreground"
                        )}
                    >
                        {record.quantity_change > 0 ? "+" : ""}
                        {record.quantity_change}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                        {record.quantity_before} → {record.quantity_after}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                            getMovementBadgeClasses(record.movement_type)
                        )}
                    >
                        {formatMovementType(record.movement_type)}
                    </span>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground" title={formatAbsoluteTime(record.created_at)}>
                        {formatRelativeTime(record.created_at)}
                    </p>
                    {record.user_name && (
                        <p className="text-[10px] text-muted-foreground">
                            by {record.user_name}
                        </p>
                    )}
                </div>
            </div>

            {record.notes && (
                <p className="text-xs text-muted-foreground mt-2 italic">
                    &ldquo;{record.notes}&rdquo;
                </p>
            )}
        </div>
    );
}

export function StockHistoryClient() {
    const [filters, setFilters] = useState<StockHistoryFilters>({
        page: 1,
        pageSize: 25,
    });

    const { data: historyData, isLoading, error } = useStockHistory(filters);

    const handlePageChange = (page: number) => {
        setFilters((prev) => ({ ...prev, page }));
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <StockHistoryFiltersComponent
                filters={filters}
                onFiltersChange={setFilters}
            />

            {/* Loading State */}
            {isLoading && (
                <div className="space-y-3">
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="border border-destructive rounded-xl p-6 text-center">
                    <p className="text-destructive text-sm">
                        Failed to load stock history. Please try again.
                    </p>
                </div>
            )}

            {/* Results */}
            {!isLoading && !error && historyData && (
                <>
                    {/* Results count */}
                    <p className="text-sm text-muted-foreground">
                        Showing {historyData.data.length} of {historyData.total} movements
                    </p>

                    {/* Movement Cards */}
                    {historyData.data.length > 0 ? (
                        <div className="space-y-3">
                            {historyData.data.map((record) => (
                                <MovementCard key={record.id} record={record} />
                            ))}
                        </div>
                    ) : (
                        <div className="border border-border/50 rounded-xl p-12 text-center">
                            <RefreshCw className="size-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">
                                No stock movements found. Adjust your filters or make a stock
                                adjustment first.
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    <PaginationControls
                        currentPage={historyData.currentPage}
                        pageCount={historyData.pageCount}
                        onPageChange={handlePageChange}
                    />
                </>
            )}
        </div>
    );
}

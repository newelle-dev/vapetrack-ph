"use client";

import { SearchInput } from "@/components/ui/search-input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StockHistoryFilters } from "@/lib/hooks/useStockHistory";

interface StockHistoryFiltersProps {
    filters: StockHistoryFilters;
    onFiltersChange: (filters: StockHistoryFilters) => void;
}

export function StockHistoryFiltersComponent({
    filters,
    onFiltersChange,
}: StockHistoryFiltersProps) {
    return (
        <div className="space-y-3">
            {/* Search + Type filter row */}
            <div className="flex flex-col sm:flex-row gap-3">
                <SearchInput
                    value={filters.search || ""}
                    onChange={(value) =>
                        onFiltersChange({ ...filters, search: value, page: 1 })
                    }
                    placeholder="Search product or SKU..."
                    className="flex-1"
                />
                <Select
                    value={filters.movementType || "all"}
                    onValueChange={(value) =>
                        onFiltersChange({ ...filters, movementType: value, page: 1 })
                    }
                >
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="stock_in">Stock In</SelectItem>
                        <SelectItem value="stock_out">Stock Out</SelectItem>
                        <SelectItem value="adjustment">Adjustment</SelectItem>
                        <SelectItem value="sale">Sale</SelectItem>
                        <SelectItem value="initial_stock">Initial Stock</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Date range row */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input
                        type="date"
                        value={filters.dateFrom || ""}
                        onChange={(e) =>
                            onFiltersChange({ ...filters, dateFrom: e.target.value, page: 1 })
                        }
                        className="h-10"
                    />
                </div>
                <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                        type="date"
                        value={filters.dateTo || ""}
                        onChange={(e) =>
                            onFiltersChange({ ...filters, dateTo: e.target.value, page: 1 })
                        }
                        className="h-10"
                    />
                </div>
            </div>
        </div>
    );
}

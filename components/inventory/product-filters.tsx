"use client";

import { useState, useEffect } from "react";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronDown, X } from "lucide-react";
import { useCategories } from "@/lib/hooks/useProducts";
import type { ProductFilterOptions } from "@/types";

interface ProductFiltersProps {
  onFiltersChange: (filters: ProductFilterOptions) => void;
  initialFilters?: ProductFilterOptions;
}

export function ProductFilters({
  onFiltersChange,
  initialFilters,
}: ProductFiltersProps) {
  const [search, setSearch] = useState(initialFilters?.search || "");
  const [categoryId, setCategoryId] = useState<string | undefined>(
    initialFilters?.categoryId,
  );
  const [isActive, setIsActive] = useState<boolean | undefined>(
    initialFilters?.isActive,
  );

  const { data: categories, isLoading: categoriesLoading } = useCategories();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({
        search: search || undefined,
        categoryId,
        isActive,
        page: 1, // Reset to first page on filter change
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, categoryId, isActive]);

  const handleClearFilters = () => {
    setSearch("");
    setCategoryId(undefined);
    setIsActive(undefined);
  };

  const selectedCategory = categories?.find((c) => c.id === categoryId);
  const hasActiveFilters = search || categoryId || isActive !== undefined;

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card">
      {/* Search */}
      <div className="w-full">
        <SearchInput
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(val) => setSearch(val)}
          className="w-full"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">
              Category:
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-w-[140px] justify-between"
                >
                  <span className="truncate">
                    {selectedCategory?.name || "All Categories"}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuItem onClick={() => setCategoryId(undefined)}>
                  All Categories
                </DropdownMenuItem>
                {categories?.map((category) => (
                  <DropdownMenuItem
                    key={category.id}
                    onClick={() => setCategoryId(category.id)}
                  >
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Active Status Filter */}
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">
              Active Only:
            </Label>
            <Switch
              checked={isActive === true}
              onCheckedChange={(checked) =>
                setIsActive(checked ? true : undefined)
              }
            />
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="shrink-0"
          >
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}

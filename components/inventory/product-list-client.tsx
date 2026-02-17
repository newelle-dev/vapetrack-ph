"use client";

import { useState } from "react";
import { useProducts } from "@/lib/hooks/useProducts";
import { ProductFilters } from "./product-filters";
import { ProductTable } from "./product-table";
import { ProductCard } from "./product-card";
import { ProductDetailsDialog } from "./product-details-dialog";
import { PaginationControls } from "./pagination-controls";
import type { ProductFilterOptions, ProductCategory } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductListClientProps {
  initialCategories: ProductCategory[];
}

export function ProductListClient({
  initialCategories,
}: ProductListClientProps) {
  const [filters, setFilters] = useState<ProductFilterOptions>({
    page: 1,
    pageSize: 25,
  });
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: productsData, isLoading, error } = useProducts(filters);

  const handleFiltersChange = (newFilters: ProductFilterOptions) => {
    setFilters({ ...newFilters, pageSize: 25 });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleViewProduct = (productId: string) => {
    setSelectedProductId(productId);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <ProductFilters
        onFiltersChange={handleFiltersChange}
        initialFilters={filters}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="border border-destructive rounded-lg p-6 text-center">
          <p className="text-destructive">
            Failed to load products. Please try again.
          </p>
        </div>
      )}

      {/* Products Display */}
      {!isLoading && !error && productsData && (
        <>
          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            Showing {productsData.data.length} of {productsData.total} products
          </div>

          {/* Desktop Table View */}
          <ProductTable
            products={productsData.data}
            onViewProduct={handleViewProduct}
          />

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {productsData.data.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handleViewProduct(product.id)}
              />
            ))}
          </div>

          {/* Empty State */}
          {productsData.data.length === 0 && (
            <div className="border rounded-lg p-12 text-center">
              <p className="text-muted-foreground">
                No products found. Try adjusting your filters.
              </p>
            </div>
          )}

          {/* Pagination */}
          <PaginationControls
            currentPage={productsData.currentPage}
            pageCount={productsData.pageCount}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Product Details Dialog */}
      <ProductDetailsDialog
        productId={selectedProductId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

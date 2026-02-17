"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductById } from "@/lib/hooks/useProducts";
import { formatCurrency } from "@/lib/utils";

interface ProductDetailsDialogProps {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailsDialog({
  productId,
  open,
  onOpenChange,
}: ProductDetailsDialogProps) {
  const { data: product, isLoading } = useProductById(productId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Product Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : product ? (
          <div className="space-y-6">
            {/* Product Info */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-2xl font-bold">{product.name}</h2>
                  {product.brand && (
                    <p className="text-muted-foreground">{product.brand}</p>
                  )}
                </div>
                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              {/* Category */}
              {product.category && (
                <div className="mb-3">
                  <span className="text-sm text-muted-foreground">
                    Category:{" "}
                  </span>
                  <Badge variant="outline">{product.category.name}</Badge>
                </div>
              )}

              {/* Description (if exists) */}
              {product.description && (
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground mb-1">
                    Description:
                  </p>
                  <p className="text-sm">{product.description}</p>
                </div>
              )}

              {/* SKU/Slug */}
              <div className="text-sm text-muted-foreground">
                <p>Slug: {product.slug}</p>
              </div>
            </div>

            {/* Variants */}
            <div>
              <h3 className="font-semibold mb-3">
                Variants ({product.variants?.length || 0})
              </h3>
              {product.variants && product.variants.length > 0 ? (
                <div className="space-y-2">
                  {product.variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{variant.name}</p>
                          <p className="text-sm text-muted-foreground">
                            SKU: {variant.sku}
                          </p>
                        </div>
                        <Badge
                          variant={variant.is_active ? "default" : "secondary"}
                        >
                          {variant.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      {/* Pricing (if available) */}
                      {variant.selling_price && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Price: </span>
                          <span className="font-medium">
                            {formatCurrency(variant.selling_price)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No variants available
                </p>
              )}
            </div>

            {/* Metadata */}
            <div className="text-xs text-muted-foreground pt-4 border-t">
              <p>
                Created: {new Date(product.created_at).toLocaleDateString()}
              </p>
              <p>
                Updated: {new Date(product.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Product not found
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

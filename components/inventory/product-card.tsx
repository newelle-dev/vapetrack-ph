"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ProductWithCategory } from "@/types";

interface ProductCardProps {
  product: ProductWithCategory;
  onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <Card
      className="cursor-pointer hover:bg-accent transition-colors active:scale-[0.98]"
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Product Name */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-base line-clamp-2">
            {product.name}
          </h3>
          <Badge
            variant={product.is_active ? "default" : "secondary"}
            className="shrink-0"
          >
            {product.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Brand */}
        {product.brand && (
          <p className="text-sm text-muted-foreground mb-2">{product.brand}</p>
        )}

        {/* Category & Variants */}
        <div className="flex items-center justify-between text-sm">
          <div>
            {product.category_name ? (
              <Badge variant="outline">{product.category_name}</Badge>
            ) : (
              <span className="text-muted-foreground">Uncategorized</span>
            )}
          </div>
          <span className="text-muted-foreground">
            {product.variant_count}{" "}
            {product.variant_count === 1 ? "variant" : "variants"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

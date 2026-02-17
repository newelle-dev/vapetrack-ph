"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import Link from "next/link";
import type { ProductWithCategory } from "@/types";

interface ProductCardProps {
  product: ProductWithCategory;
  onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <Card className="hover:bg-accent/50 transition-colors active:scale-[0.98]">
      <CardContent className="p-4">
        {/* Product Name */}
        <div
          className="flex items-start justify-between gap-2 mb-2 cursor-pointer"
          onClick={onClick}
        >
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
          <p
            className="text-sm text-muted-foreground mb-2 cursor-pointer"
            onClick={onClick}
          >
            {product.brand}
          </p>
        )}

        {/* Category & Variants */}
        <div
          className="flex items-center justify-between text-sm mb-3 cursor-pointer"
          onClick={onClick}
        >
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

        {/* Edit Button */}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/inventory/products/${product.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Product
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

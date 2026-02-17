"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";
import type { ProductWithCategory } from "@/types";

interface ProductTableProps {
  products: ProductWithCategory[];
  onViewProduct: (productId: string) => void;
}

export function ProductTable({ products, onViewProduct }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="hidden md:block">
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">No products found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:block border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-center">Variants</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.brand || "—"}</TableCell>
              <TableCell>
                {product.category_name ? (
                  <Badge variant="outline">{product.category_name}</Badge>
                ) : (
                  <span className="text-muted-foreground">Uncategorized</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {product.variant_count}
              </TableCell>
              <TableCell>
                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewProduct(product.id)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

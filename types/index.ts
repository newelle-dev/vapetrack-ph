import type { Database } from "./database";

// Base types from database
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductVariant =
  Database["public"]["Tables"]["product_variants"]["Row"];
export type ProductCategory =
  Database["public"]["Tables"]["product_categories"]["Row"];

// Extended types for UI
export interface ProductWithCategory extends Product {
  category_name?: string | null;
  variant_count: number;
}

export interface ProductWithVariants extends Product {
  category?: ProductCategory | null;
  variants: ProductVariant[];
}

// Filter options
export interface ProductFilterOptions {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  pageCount: number;
  currentPage: number;
}

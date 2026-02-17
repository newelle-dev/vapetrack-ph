"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
  PaginatedResponse,
  ProductFilterOptions,
  ProductWithCategory,
  ProductWithVariants,
} from "@/types";

const DEFAULT_PAGE_SIZE = 25;

/**
 * Fetch paginated products with filters
 * Automatically filtered by organization via RLS
 */
export function useProducts(filters?: ProductFilterOptions) {
  const supabase = createClient();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || DEFAULT_PAGE_SIZE;

  return useQuery<PaginatedResponse<ProductWithCategory>>({
    queryKey: ["products", filters],
    queryFn: async () => {
      // Build base query
      let query = supabase
        .from("products")
        .select(
          `
          *,
          product_categories!left(name),
          product_variants!left(id)
        `,
          { count: "exact" },
        )
        .is("deleted_at", null);

      // Apply filters
      if (filters?.search) {
        // Search in product name or variant SKU
        query = query.or(
          `name.ilike.%${filters.search}%,product_variants.sku.ilike.%${filters.search}%`,
        );
      }

      if (filters?.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }

      if (filters?.isActive !== undefined) {
        query = query.eq("is_active", filters.isActive);
      }

      // Apply pagination
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      query = query.range(start, end);

      // Sort by created date (newest first)
      query = query.order("created_at", { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform data to include category name and variant count
      const transformedData: ProductWithCategory[] = (data || []).map(
        (product: any) => {
          // Count variants (filter out deleted ones)
          const variantCount =
            product.product_variants?.filter((v: any) => !v.deleted_at)
              .length || 0;

          return {
            ...product,
            category_name: product.product_categories?.name || null,
            variant_count: variantCount,
          };
        },
      );

      return {
        data: transformedData,
        total: count || 0,
        pageCount: Math.ceil((count || 0) / pageSize),
        currentPage: page,
      };
    },
  });
}

/**
 * Fetch single product with all variants
 * Automatically filtered by organization via RLS
 */
export function useProductById(productId: string | null) {
  const supabase = createClient();

  return useQuery<ProductWithVariants | null>({
    queryKey: ["products", productId],
    enabled: !!productId,
    queryFn: async () => {
      if (!productId) return null;

      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          category:product_categories(*),
          variants:product_variants!inner(*)
        `,
        )
        .eq("id", productId)
        .is("deleted_at", null)
        .single();

      if (error) throw error;

      // Filter out deleted variants
      const variants = data.variants?.filter((v: any) => !v.deleted_at) || [];

      return {
        ...data,
        variants,
      } as ProductWithVariants;
    },
  });
}

/**
 * Fetch all categories for filter dropdown
 * Automatically filtered by organization via RLS
 */
export function useCategories() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .is("deleted_at", null)
        .is("parent_id", null) // Only root categories for now
        .order("name");

      if (error) throw error;
      return data;
    },
  });
}

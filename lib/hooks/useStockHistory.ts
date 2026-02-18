"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface StockMovementRecord {
    id: string;
    created_at: string;
    movement_type: string;
    quantity_change: number;
    quantity_before: number;
    quantity_after: number;
    notes: string | null;
    branch_name: string;
    variant_name: string;
    variant_sku: string;
    product_name: string;
    user_name: string | null;
}

export interface StockHistoryFilters {
    movementType?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 25;

export function useStockHistory(filters?: StockHistoryFilters) {
    const supabase = createClient();
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || DEFAULT_PAGE_SIZE;

    return useQuery({
        queryKey: ["stock-history", filters],
        queryFn: async () => {
            let query = supabase
                .from("stock_movements")
                .select(
                    `
          id,
          created_at,
          movement_type,
          quantity_change,
          quantity_before,
          quantity_after,
          notes,
          branches!inner ( name ),
          product_variants!inner (
            name,
            sku,
            products!inner ( name )
          ),
          users ( full_name )
        `,
                    { count: "exact" }
                )
                .order("created_at", { ascending: false });

            // Apply filters
            if (filters?.movementType && filters.movementType !== "all") {
                query = query.eq("movement_type", filters.movementType);
            }

            if (filters?.dateFrom) {
                query = query.gte("created_at", filters.dateFrom);
            }

            if (filters?.dateTo) {
                // Add a day to include the full end date
                const nextDay = new Date(filters.dateTo);
                nextDay.setDate(nextDay.getDate() + 1);
                query = query.lt("created_at", nextDay.toISOString());
            }

            // Pagination
            const start = (page - 1) * pageSize;
            const end = start + pageSize - 1;
            query = query.range(start, end);

            const { data, error, count } = await query;

            if (error) throw error;

            // Transform data
            const records: StockMovementRecord[] = (data || []).map((row: any) => ({
                id: row.id,
                created_at: row.created_at,
                movement_type: row.movement_type,
                quantity_change: row.quantity_change,
                quantity_before: row.quantity_before,
                quantity_after: row.quantity_after,
                notes: row.notes,
                branch_name: row.branches?.name || "Unknown",
                variant_name: row.product_variants?.name || "Unknown",
                variant_sku: row.product_variants?.sku || "",
                product_name: row.product_variants?.products?.name || "Unknown",
                user_name: row.users?.full_name || null,
            }));

            // Client-side search filter (for product/variant name)
            let filtered = records;
            if (filters?.search) {
                const term = filters.search.toLowerCase();
                filtered = records.filter(
                    (r) =>
                        r.product_name.toLowerCase().includes(term) ||
                        r.variant_name.toLowerCase().includes(term) ||
                        r.variant_sku.toLowerCase().includes(term)
                );
            }

            return {
                data: filtered,
                total: count || 0,
                pageCount: Math.ceil((count || 0) / pageSize),
                currentPage: page,
            };
        },
    });
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
    stockAdjustmentSchema,
    type StockAdjustmentInput,
} from "@/lib/validations/inventory";
import type {
    InventoryItem,
    StockGroupedByProduct,
    Branch,
} from "@/types";

export type ActionResult<T = void> = {
    success: boolean;
    error?: string;
    data?: T;
};

// ─── Helper: Get authenticated user + organization ───

async function getAuthContext() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: userData } = await supabase
        .from("users")
        .select("organization_id, role")
        .eq("id", user.id)
        .single();

    if (!userData?.organization_id) return null;

    return { supabase, user, organizationId: userData.organization_id };
}

// ─── ADJUST STOCK ───

export async function adjustStock(
    data: StockAdjustmentInput
): Promise<ActionResult<{ newQuantity: number }>> {
    const ctx = await getAuthContext();
    if (!ctx) return { success: false, error: "Unauthorized" };

    const parsed = stockAdjustmentSchema.safeParse(data);
    if (!parsed.success) {
        return {
            success: false,
            error: parsed.error.issues[0]?.message || "Validation failed",
        };
    }

    const { supabase, user } = ctx;

    try {
        const { data: result, error } = await supabase.rpc("adjust_stock", {
            p_variant_id: parsed.data.variant_id,
            p_branch_id: parsed.data.branch_id,
            p_quantity: parsed.data.quantity,
            p_movement_type: parsed.data.movement_type,
            p_reason: parsed.data.reason,
            p_user_id: user.id,
        });

        if (error) {
            // Parse Postgres exception message for user-friendly errors
            const msg = error.message || "Failed to adjust stock";
            if (msg.includes("Insufficient stock")) {
                return { success: false, error: "Insufficient stock for this adjustment." };
            }
            if (msg.includes("Inventory record not found")) {
                return { success: false, error: "Inventory record not found for this variant and branch." };
            }
            return { success: false, error: msg };
        }

        revalidatePath("/inventory/stock");
        revalidatePath("/inventory/history");

        return { success: true, data: { newQuantity: result as number } };
    } catch (error: any) {
        console.error("Adjust stock error:", error);
        return {
            success: false,
            error: error.message || "Failed to adjust stock",
        };
    }
}

// ─── GET INVENTORY WITH PRODUCTS ───

export async function getInventoryWithProducts(
    branchId?: string
): Promise<StockGroupedByProduct[]> {
    const ctx = await getAuthContext();
    if (!ctx) return [];

    const { supabase } = ctx;

    try {
        // Build query: inventory joined with product_variants and products
        let query = supabase
            .from("inventory")
            .select(
                `
        quantity,
        branch_id,
        product_variant_id,
        product_variants!inner (
          id,
          name,
          sku,
          low_stock_threshold,
          product_id,
          deleted_at,
          products!inner (
            id,
            name,
            brand,
            is_active,
            deleted_at
          )
        )
      `
            );

        // Filter by specific branch if provided
        if (branchId) {
            query = query.eq("branch_id", branchId);
        }

        const { data: inventoryRows, error } = await query;

        if (error) {
            console.error("Get inventory error:", error);
            return [];
        }

        if (!inventoryRows || inventoryRows.length === 0) return [];

        // Aggregate and group by product
        const variantMap = new Map<
            string,
            InventoryItem
        >();

        for (const row of inventoryRows as any[]) {
            const variant = row.product_variants;
            const product = variant.products;

            // Skip deleted variants/products
            if (variant.deleted_at || product.deleted_at || !product.is_active) {
                continue;
            }

            const key = branchId
                ? `${variant.id}-${row.branch_id}`
                : variant.id;

            if (variantMap.has(key)) {
                // Aggregate quantity across branches
                const existing = variantMap.get(key)!;
                existing.quantity += row.quantity;
            } else {
                variantMap.set(key, {
                    variant_id: variant.id,
                    variant_name: variant.name,
                    sku: variant.sku,
                    product_id: product.id,
                    product_name: product.name,
                    brand: product.brand,
                    low_stock_threshold: variant.low_stock_threshold,
                    quantity: row.quantity,
                    branch_id: branchId || null,
                });
            }
        }

        // Group by product
        const productMap = new Map<string, StockGroupedByProduct>();

        for (const item of variantMap.values()) {
            if (!productMap.has(item.product_id)) {
                productMap.set(item.product_id, {
                    product_id: item.product_id,
                    product_name: item.product_name,
                    brand: item.brand,
                    variants: [],
                });
            }
            productMap.get(item.product_id)!.variants.push(item);
        }

        // Sort products alphabetically, variants by name
        const result = Array.from(productMap.values()).sort((a, b) =>
            a.product_name.localeCompare(b.product_name)
        );

        for (const group of result) {
            group.variants.sort((a, b) =>
                a.variant_name.localeCompare(b.variant_name)
            );
        }

        return result;
    } catch (error) {
        console.error("Get inventory error:", error);
        return [];
    }
}

// ─── GET BRANCHES ───

export async function getBranches(): Promise<Branch[]> {
    const ctx = await getAuthContext();
    if (!ctx) return [];

    const { supabase } = ctx;

    const { data, error } = await supabase
        .from("branches")
        .select("id, name, is_default")
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .order("name");

    if (error) {
        console.error("Get branches error:", error);
        return [];
    }

    return data || [];
}

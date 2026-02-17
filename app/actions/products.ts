"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
    createProductSchema,
    updateProductSchema,
    type CreateProductInput,
    type UpdateProductInput,
} from "@/lib/validations/product";
import { slugify, generateUniqueSlug } from "@/lib/utils/slugify";

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

// ─── CREATE PRODUCT ───

export async function createProduct(
    data: CreateProductInput
): Promise<ActionResult<{ productId: string }>> {
    const ctx = await getAuthContext();
    if (!ctx) return { success: false, error: "Unauthorized" };

    const parsed = createProductSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
    }

    const { supabase, user, organizationId } = ctx;

    try {
        // 1. Generate product slug
        const baseSlug = slugify(parsed.data.name);
        const slug = generateUniqueSlug(baseSlug);

        // 2. Insert product
        const { data: product, error: productError } = await supabase
            .from("products")
            .insert({
                organization_id: organizationId,
                name: parsed.data.name,
                brand: parsed.data.brand || null,
                description: parsed.data.description || null,
                category_id: parsed.data.category_id,
                slug,
                is_active: parsed.data.is_active ?? true,
            })
            .select("id")
            .single();

        if (productError) throw productError;

        // 3. Insert all variants
        const variantInserts = parsed.data.variants.map((v) => ({
            organization_id: organizationId,
            product_id: product.id,
            name: v.name,
            sku: v.sku,
            selling_price: v.selling_price,
            capital_cost: v.capital_cost,
            is_active: true,
        }));

        const { data: variants, error: variantError } = await supabase
            .from("product_variants")
            .insert(variantInserts)
            .select("id");

        if (variantError) throw variantError;

        // 4. Fetch all active branches for inventory creation
        const { data: branches, error: branchError } = await supabase
            .from("branches")
            .select("id")
            .eq("organization_id", organizationId)
            .eq("is_active", true);

        if (branchError) throw branchError;

        // 5. Create inventory records for each variant × each branch
        if (branches && branches.length > 0 && variants && variants.length > 0) {
            const inventoryInserts: Array<{
                organization_id: string;
                branch_id: string;
                product_variant_id: string;
                quantity: number;
            }> = [];

            for (const variant of variants) {
                const variantData = parsed.data.variants[variants.indexOf(variant)];
                const initialStock = variantData?.initial_stock ?? 0;

                for (const branch of branches) {
                    inventoryInserts.push({
                        organization_id: organizationId,
                        branch_id: branch.id,
                        product_variant_id: variant.id,
                        quantity: initialStock,
                    });
                }
            }

            const { error: inventoryError } = await supabase
                .from("inventory")
                .insert(inventoryInserts);

            if (inventoryError) throw inventoryError;

            // 6. Create stock_movements for variants with initial_stock > 0
            const movementInserts: Array<{
                organization_id: string;
                branch_id: string;
                product_variant_id: string;
                quantity_change: number;
                quantity_before: number;
                quantity_after: number;
                movement_type: string;
                user_id: string;
                notes: string;
            }> = [];

            for (let i = 0; i < variants.length; i++) {
                const variantData = parsed.data.variants[i];
                const initialStock = variantData?.initial_stock ?? 0;
                if (initialStock > 0) {
                    for (const branch of branches) {
                        movementInserts.push({
                            organization_id: organizationId,
                            branch_id: branch.id,
                            product_variant_id: variants[i].id,
                            quantity_change: initialStock,
                            quantity_before: 0,
                            quantity_after: initialStock,
                            movement_type: "initial_stock",
                            user_id: user.id,
                            notes: "Initial stock on product creation",
                        });
                    }
                }
            }

            if (movementInserts.length > 0) {
                const { error: movementError } = await supabase
                    .from("stock_movements")
                    .insert(movementInserts);

                if (movementError) {
                    console.error("Stock movement creation error:", movementError);
                    // Non-fatal: inventory was created, movement logging failed
                }
            }
        }

        revalidatePath("/inventory");
        revalidatePath("/inventory/products");

        return { success: true, data: { productId: product.id } };
    } catch (error: any) {
        console.error("Create product error:", error);
        return {
            success: false,
            error: error.message || "Failed to create product",
        };
    }
}

// ─── UPDATE PRODUCT ───

export async function updateProduct(
    id: string,
    data: UpdateProductInput
): Promise<ActionResult> {
    const ctx = await getAuthContext();
    if (!ctx) return { success: false, error: "Unauthorized" };

    const parsed = updateProductSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
    }

    const { supabase, user, organizationId } = ctx;

    try {
        // 1. Update product fields
        const { error: productError } = await supabase
            .from("products")
            .update({
                name: parsed.data.name,
                brand: parsed.data.brand || null,
                description: parsed.data.description || null,
                category_id: parsed.data.category_id,
                is_active: parsed.data.is_active ?? true,
            })
            .eq("id", id)
            .eq("organization_id", organizationId);

        if (productError) throw productError;

        // 2. Get existing variant IDs from DB
        const { data: existingVariants, error: fetchError } = await supabase
            .from("product_variants")
            .select("id")
            .eq("product_id", id)
            .is("deleted_at", null);

        if (fetchError) throw fetchError;

        const existingIds = new Set(existingVariants?.map((v) => v.id) || []);
        const payloadIds = new Set(
            parsed.data.variants.filter((v) => v.id).map((v) => v.id!)
        );

        // 3. Soft-delete variants not in payload
        const toDelete = [...existingIds].filter((eid) => !payloadIds.has(eid));
        if (toDelete.length > 0) {
            const { error: deleteError } = await supabase
                .from("product_variants")
                .update({ deleted_at: new Date().toISOString() })
                .in("id", toDelete);

            if (deleteError) throw deleteError;
        }

        // 4. Update existing variants
        for (const variant of parsed.data.variants) {
            if (variant.id && existingIds.has(variant.id)) {
                const { error: updateError } = await supabase
                    .from("product_variants")
                    .update({
                        name: variant.name,
                        sku: variant.sku,
                        selling_price: variant.selling_price,
                        capital_cost: variant.capital_cost,
                        is_active: variant.is_active ?? true,
                    })
                    .eq("id", variant.id);

                if (updateError) throw updateError;
            }
        }

        // 5. Insert new variants (no id)
        const newVariants = parsed.data.variants.filter((v) => !v.id);
        if (newVariants.length > 0) {
            const newInserts = newVariants.map((v) => ({
                organization_id: organizationId,
                product_id: id,
                name: v.name,
                sku: v.sku,
                selling_price: v.selling_price,
                capital_cost: v.capital_cost,
                is_active: v.is_active ?? true,
            }));

            const { data: insertedVariants, error: insertError } = await supabase
                .from("product_variants")
                .insert(newInserts)
                .select("id");

            if (insertError) throw insertError;

            // 6. Create inventory records for new variants across all branches
            if (insertedVariants && insertedVariants.length > 0) {
                const { data: branches } = await supabase
                    .from("branches")
                    .select("id")
                    .eq("organization_id", organizationId)
                    .eq("is_active", true);

                if (branches && branches.length > 0) {
                    const inventoryInserts = insertedVariants.flatMap((variant) =>
                        branches.map((branch) => ({
                            organization_id: organizationId,
                            branch_id: branch.id,
                            product_variant_id: variant.id,
                            quantity: 0,
                        }))
                    );

                    const { error: inventoryError } = await supabase
                        .from("inventory")
                        .insert(inventoryInserts);

                    if (inventoryError) {
                        console.error("Inventory creation for new variants error:", inventoryError);
                    }
                }
            }
        }

        revalidatePath("/inventory");
        revalidatePath("/inventory/products");
        revalidatePath(`/inventory/products/${id}/edit`);

        return { success: true };
    } catch (error: any) {
        console.error("Update product error:", error);
        return {
            success: false,
            error: error.message || "Failed to update product",
        };
    }
}

// ─── GET PRODUCT FOR EDIT ───

export async function getProductForEdit(id: string) {
    const ctx = await getAuthContext();
    if (!ctx) return null;

    const { supabase, organizationId } = ctx;

    const { data: product, error } = await supabase
        .from("products")
        .select(
            `
      *,
      variants:product_variants(*)
    `
        )
        .eq("id", id)
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .single();

    if (error || !product) return null;

    // Filter out deleted variants
    const variants =
        (product.variants as any[])?.filter((v: any) => !v.deleted_at) || [];

    return {
        ...product,
        variants,
    };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { categorySchema, type CategoryInput } from "@/lib/validations/category";
import { slugify, generateUniqueSlug } from "@/lib/utils/slugify";

export type ActionResult<T = void> = {
    success: boolean;
    error?: string;
    data?: T;
};

export async function getCategories(
    query?: string,
    page: number = 1,
    pageSize: number = 10
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Get user's organization
    const { data: userData } = await supabase
        .from("users")
        .select("organization_id")
        .eq("id", user.id)
        .single();

    if (!userData?.organization_id) throw new Error("Organization not found");

    let dbQuery = supabase
        .from("product_categories")
        .select("*", { count: "exact" })
        .eq("organization_id", userData.organization_id)
        .is("deleted_at", null)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

    if (query) {
        dbQuery = dbQuery.ilike("name", `%${query}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await dbQuery.range(from, to);

    if (error) {
        console.error("Error fetching categories:", error);
        throw new Error("Failed to fetch categories");
    }

    return {
        data,
        metadata: {
            total: count || 0,
            page,
            pageSize,
            totalPages: count ? Math.ceil(count / pageSize) : 0,
        },
    };
}

export async function createCategory(data: CategoryInput): Promise<ActionResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const parsed = categorySchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.message };
    }

    try {
        const { data: userData } = await supabase
            .from("users")
            .select("organization_id, role")
            .eq("id", user.id)
            .single();

        if (!userData) return { success: false, error: "User not found" };

        // Generate Slug
        const baseSlug = slugify(parsed.data.name);
        const slug = generateUniqueSlug(baseSlug);

        const { error } = await supabase.from("product_categories").insert({
            organization_id: userData.organization_id,
            name: parsed.data.name,
            slug: slug,
            description: parsed.data.description,
            parent_id: parsed.data.parent_id,
            display_order: parsed.data.display_order,
        });

        if (error) throw error;

        revalidatePath("/inventory/categories");
        return { success: true };
    } catch (error: any) {
        console.error("Create category error:", error);
        return { success: false, error: error.message || "Failed to create category" };
    }
}

export async function updateCategory(id: string, data: CategoryInput): Promise<ActionResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const parsed = categorySchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.message };
    }

    try {
        const { error } = await supabase
            .from("product_categories")
            .update({
                name: parsed.data.name,
                description: parsed.data.description,
                parent_id: parsed.data.parent_id,
                display_order: parsed.data.display_order,
            })
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/inventory/categories");
        return { success: true };
    } catch (error: any) {
        console.error("Update category error:", error);
        return { success: false, error: error.message || "Failed to update category" };
    }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    try {
        // Soft delete
        const { error } = await supabase
            .from("product_categories")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/inventory/categories");
        return { success: true };
    } catch (error: any) {
        console.error("Delete category error:", error);
        return { success: false, error: error.message || "Failed to delete category" };
    }
}

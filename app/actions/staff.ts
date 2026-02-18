"use server";

import { createClient } from "@/lib/supabase/server";
import { hashPin } from "@/lib/auth/password";
import { revalidatePath } from "next/cache";
import type { CreateStaffInput, UpdateStaffInput } from "@/lib/validations/staff";

type ActionResult<T = void> = {
    success: boolean;
    error?: string;
    data?: T;
};

/**
 * Helper: get the current owner's profile. Returns null if not owner.
 */
async function getOwnerProfile() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from("users")
        .select("id, organization_id, role")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== "owner") return null;
    return profile;
}

/**
 * Get all staff members for the current organization.
 */
export async function getStaffMembers(): Promise<
    ActionResult<
        {
            id: string;
            full_name: string;
            email: string | null;
            pin: string | null;
            role: string;
            is_active: boolean | null;
            can_manage_inventory: boolean | null;
            can_view_profits: boolean | null;
            can_view_reports: boolean | null;
            last_login_at: string | null;
            created_at: string;
        }[]
    >
> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data, error } = await supabase
        .from("users")
        .select(
            "id, full_name, email, pin, role, is_active, can_manage_inventory, can_view_profits, can_view_reports, last_login_at, created_at"
        )
        .eq("role", "staff")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data: data ?? [] };
}

/**
 * Create a new staff member with a hashed PIN.
 */
export async function createStaffMember(
    input: CreateStaffInput
): Promise<ActionResult<{ id: string }>> {
    const owner = await getOwnerProfile();
    if (!owner) return { success: false, error: "Only owners can manage staff" };

    const supabase = await createClient();

    // Hash the PIN before storing
    const pinHash = await hashPin(input.pin);

    const { data, error } = await supabase
        .from("users")
        .insert({
            organization_id: owner.organization_id,
            full_name: input.full_name,
            email: input.email || null,
            pin: pinHash,
            password_hash: null,
            role: "staff",
            is_active: input.is_active,
            can_manage_inventory: input.can_manage_inventory,
            can_view_profits: input.can_view_profits,
            can_view_reports: input.can_view_reports,
        })
        .select("id")
        .single();

    if (error) {
        console.error("Create staff error:", error);
        if (error.message.includes("chk_auth_method")) {
            return { success: false, error: "Staff must have a PIN set." };
        }
        if (error.message.includes("idx_users_pin_unique")) {
            return {
                success: false,
                error: "This PIN is already in use by another staff member.",
            };
        }
        return { success: false, error: error.message };
    }

    revalidatePath("/staff");
    return { success: true, data: { id: data.id } };
}

/**
 * Update an existing staff member. Only re-hashes PIN if a new one is provided.
 */
export async function updateStaffMember(
    staffId: string,
    input: UpdateStaffInput
): Promise<ActionResult> {
    const owner = await getOwnerProfile();
    if (!owner) return { success: false, error: "Only owners can manage staff" };

    const supabase = await createClient();

    // Build update payload
    const updateData: Record<string, unknown> = {
        full_name: input.full_name,
        email: input.email || null,
        is_active: input.is_active,
        can_manage_inventory: input.can_manage_inventory,
        can_view_profits: input.can_view_profits,
        can_view_reports: input.can_view_reports,
    };

    // Only re-hash PIN if a new one is provided
    if (input.pin && input.pin.length >= 4) {
        updateData.pin = await hashPin(input.pin);
    }

    const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", staffId)
        .eq("role", "staff");

    if (error) {
        console.error("Update staff error:", error);
        if (error.message.includes("idx_users_pin_unique")) {
            return {
                success: false,
                error: "This PIN is already in use by another staff member.",
            };
        }
        return { success: false, error: error.message };
    }

    revalidatePath("/staff");
    return { success: true };
}

/**
 * Soft-delete a staff member by setting deleted_at and is_active = false.
 */
export async function deleteStaffMember(
    staffId: string
): Promise<ActionResult> {
    const owner = await getOwnerProfile();
    if (!owner) return { success: false, error: "Only owners can manage staff" };

    const supabase = await createClient();

    const { error } = await supabase
        .from("users")
        .update({
            is_active: false,
            deleted_at: new Date().toISOString(),
        })
        .eq("id", staffId)
        .eq("role", "staff");

    if (error) {
        console.error("Delete staff error:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/staff");
    return { success: true };
}

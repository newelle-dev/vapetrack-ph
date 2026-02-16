"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generateUniqueSlug, slugify } from "@/lib/utils/slugify";
import type {
  BranchCreateInput,
  BranchUpdateInput,
} from "@/lib/validations/branch";

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export async function createBranch(
  data: BranchCreateInput,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const { data: userProfile } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!userProfile) {
      return { success: false, error: "User profile not found" };
    }

    if (userProfile.role !== "owner") {
      return {
        success: false,
        error: "Only organization owners can create branches",
      };
    }

    // If setting as default, unset other defaults
    if (data.is_default) {
      await supabase
        .from("branches")
        .update({ is_default: false })
        .eq("organization_id", userProfile.organization_id)
        .eq("is_default", true);
    }

    const baseSlug = slugify(data.name);
    const slug = generateUniqueSlug(baseSlug);

    const { error } = await supabase.from("branches").insert({
      organization_id: userProfile.organization_id,
      name: data.name,
      slug,
      address: data.address,
      phone: data.phone,
      is_default: data.is_default ?? false,
      is_active: data.is_active ?? true,
    });

    if (error) {
      console.error("Branch creation error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/branches");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateBranch(
  id: string,
  data: BranchUpdateInput,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const { data: userProfile } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!userProfile) {
      return { success: false, error: "User profile not found" };
    }

    if (userProfile.role !== "owner") {
      return {
        success: false,
        error: "Only organization owners can update branches",
      };
    }

    // If setting as default, unset other defaults
    if (data.is_default) {
      await supabase
        .from("branches")
        .update({ is_default: false })
        .eq("organization_id", userProfile.organization_id)
        .eq("is_default", true)
        .neq("id", id);
    }

    const { error } = await supabase
      .from("branches")
      .update({
        name: data.name,
        address: data.address,
        phone: data.phone,
        is_default: data.is_default ?? false,
        is_active: data.is_active ?? true,
      })
      .eq("id", id)
      .eq("organization_id", userProfile.organization_id);

    if (error) {
      console.error("Branch update error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/branches");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deleteBranch(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const { data: userProfile } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!userProfile) {
      return { success: false, error: "User profile not found" };
    }

    if (userProfile.role !== "owner") {
      return {
        success: false,
        error: "Only organization owners can delete branches",
      };
    }

    // Check if branch is default
    const { data: branch } = await supabase
      .from("branches")
      .select("is_default")
      .eq("id", id)
      .eq("organization_id", userProfile.organization_id)
      .single();

    if (!branch) {
      return { success: false, error: "Branch not found" };
    }

    if (branch.is_default) {
      return { success: false, error: "Cannot delete default branch" };
    }

    const { error } = await supabase
      .from("branches")
      .delete()
      .eq("id", id)
      .eq("organization_id", userProfile.organization_id);

    if (error) {
      console.error("Branch deletion error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/branches");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
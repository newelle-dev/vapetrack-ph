"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { OrganizationUpdateInput } from "@/lib/validations/organization";

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export async function updateOrganization(
  data: OrganizationUpdateInput,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // Fetch user profile to get organization_id
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
        error: "Only organization owners can update settings",
      };
    }

    // RLS automatically filters to user's organization
    const { error } = await supabase
      .from("organizations")
      .update({
        name: data.name,
        address: data.address,
        phone: data.phone,
      })
      .eq("id", userProfile.organization_id);

    if (error) {
      console.error("Organization update error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/settings");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
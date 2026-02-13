"use server";

import { createClient } from "@/lib/supabase/server";
import { slugify, generateUniqueSlug } from "@/lib/utils/slugify";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SignupInput, LoginInput } from "@/lib/validations/auth";

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Sign up a new shop owner
 * Creates: organization → user → default branch
 * Automatically logs in the user on success
 */
export async function signUp(
  data: SignupInput,
): Promise<ActionResult<{ userId: string }>> {
  const supabase = await createClient();

  try {
    // 1. Create auth user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
      },
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        return { success: false, error: "Email already in use" };
      }
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: "Failed to create user" };
    }

    const userId = authData.user.id;

    // 2. Generate unique organization slug
    let orgSlug = slugify(data.shopName);
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const { data: existingOrg } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", orgSlug)
        .single();

      if (!existingOrg) break;

      orgSlug = generateUniqueSlug(slugify(data.shopName));
      attempts++;
    }

    if (attempts === maxAttempts) {
      // Rollback auth user if org creation fails
      await supabase.auth.admin.deleteUser(userId);
      return {
        success: false,
        error:
          "Unable to create unique shop identifier. Please try a different shop name.",
      };
    }

    // 3. Create organization record
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: data.shopName,
        slug: orgSlug,
        owner_email: data.email,
        subscription_status: "trial",
        trial_ends_at: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 14 days
      })
      .select("id")
      .single();

    if (orgError || !organization) {
      // Rollback auth user if org creation fails
      await supabase.auth.admin.deleteUser(userId);
      return { success: false, error: "Failed to create organization" };
    }

    const organizationId = organization.id;

    // 4. Create user record in public.users table
    const { error: userError } = await supabase.from("users").insert({
      id: userId,
      organization_id: organizationId,
      email: data.email,
      full_name: data.fullName,
      role: "owner",
      is_active: true,
      can_view_profits: true,
      can_manage_inventory: true,
      can_view_reports: true,
    });

    if (userError) {
      // Rollback organization and auth user
      await supabase.from("organizations").delete().eq("id", organizationId);
      await supabase.auth.admin.deleteUser(userId);
      return { success: false, error: "Failed to create user profile" };
    }

    // 5. Create default branch
    const { error: branchError } = await supabase.from("branches").insert({
      organization_id: organizationId,
      name: "Main Branch",
      slug: "main-branch",
      is_active: true,
      is_default: true,
    });

    if (branchError) {
      // Rollback all previous operations
      await supabase.from("users").delete().eq("id", userId);
      await supabase.from("organizations").delete().eq("id", organizationId);
      await supabase.auth.admin.deleteUser(userId);
      return { success: false, error: "Failed to create default branch" };
    }

    // 6. Refresh session to get updated JWT with organization_id claim
    // The database trigger should have already injected organization_id into app_metadata
    await supabase.auth.refreshSession();

    return { success: true, data: { userId } };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      success: false,
      error: "An unexpected error occurred during signup",
    };
  }
}

/**
 * Sign in existing user with email and password
 */
export async function signIn(data: LoginInput): Promise<ActionResult> {
  const supabase = await createClient();

  try {
    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

    if (authError) {
      return { success: false, error: "Invalid email or password" };
    }

    if (!authData.user) {
      return { success: false, error: "Authentication failed" };
    }

    // 2. Verify user exists in public.users table
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("is_active, role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !userProfile) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "User profile not found. Please contact support.",
      };
    }

    // 3. Check if user is active
    if (!userProfile.is_active) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Account has been deactivated. Please contact support.",
      };
    }

    // 4. Update last login timestamp
    await supabase
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", authData.user.id);

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "An unexpected error occurred during login",
    };
  }
}

/**
 * Sign out current user and redirect to login page
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
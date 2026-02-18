"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
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
  // Service role client for database operations (bypasses RLS during signup)
  const serviceClient = createServiceClient();

  // Verify service role key is configured
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is not configured");
    return {
      success: false,
      error: "Server configuration error. Please contact support."
    };
  }

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
      const { data: existingOrg } = await serviceClient
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
      await serviceClient.auth.admin.deleteUser(userId);
      return {
        success: false,
        error:
          "Unable to create unique shop identifier. Please try a different shop name.",
      };
    }

    // 3. Create organization record (using service role to bypass RLS)
    const { data: organization, error: orgError } = await serviceClient
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
      console.error("Organization creation error:", orgError);
      await serviceClient.auth.admin.deleteUser(userId);
      return { success: false, error: `Failed to create organization: ${orgError?.message || 'Unknown error'}` };
    }

    const organizationId = organization.id;

    // 4. Create user record in public.users table (using service role to bypass RLS)
    const { error: userError } = await serviceClient.from("users").insert({
      id: userId,
      organization_id: organizationId,
      email: data.email,
      password_hash: "supabase_auth", // Placeholder - actual auth handled by Supabase Auth
      full_name: data.fullName,
      role: "owner",
      is_active: true,
      can_view_profits: true,
      can_manage_inventory: true,
      can_view_reports: true,
    });

    if (userError) {
      // Rollback organization and auth user
      console.error("User creation error:", userError);
      await serviceClient.from("organizations").delete().eq("id", organizationId);
      await serviceClient.auth.admin.deleteUser(userId);
      return { success: false, error: `Failed to create user profile: ${userError.message}` };
    }

    // 5. Create default branch (using service role to bypass RLS)
    const { error: branchError } = await serviceClient.from("branches").insert({
      organization_id: organizationId,
      name: "Main Branch",
      slug: "main-branch",
      is_active: true,
      is_default: true,
    });

    if (branchError) {
      // Rollback all previous operations
      console.error("Branch creation error:", branchError);
      await serviceClient.from("users").delete().eq("id", userId);
      await serviceClient.from("organizations").delete().eq("id", organizationId);
      await serviceClient.auth.admin.deleteUser(userId);
      return { success: false, error: `Failed to create default branch: ${branchError.message}` };
    }

    // 6. Update auth user's app_metadata with organization_id
    // This is needed because the trigger fires before public.users exists
    await serviceClient.auth.admin.updateUserById(userId, {
      app_metadata: { organization_id: organizationId },
    });

    // 7. Refresh session to get updated JWT with organization_id claim
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

/**
 * Sign out a staff user (clears custom JWT cookie)
 */
export async function signOutStaff(): Promise<void> {
  const cookieStore = await (await import("next/headers")).cookies();
  cookieStore.delete("sb-staff-token");
  revalidatePath("/", "layout");
  redirect("/login");
}
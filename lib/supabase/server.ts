import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 *
 * Usage in Server Component:
 * ```tsx
 * import { createClient } from '@/lib/supabase/server'
 *
 * export default async function ProductsPage() {
 *   const supabase = await createClient()
 *   const { data: products } = await supabase.from('products').select('*')
 *   // RLS automatically filters by organization_id
 *   return <ProductList products={products} />
 * }
 * ```
 *
 * Usage in Server Action:
 * ```tsx
 * 'use server'
 * import { createClient } from '@/lib/supabase/server'
 *
 * export async function createProduct(formData: FormData) {
 *   const supabase = await createClient()
 *   const { data, error } = await supabase
 *     .from('products')
 *     .insert({ name: formData.get('name') })
 *     .select()
 *     .single()
 *
 *   if (error) throw error
 *   return data
 * }
 * ```
 *
 * @returns Typed Supabase client with cookie handling for SSR
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component context - setAll is called from a Server Component
            // This can be ignored if you have middleware refreshing user sessions
          }
        },
      },
    },
  );
}

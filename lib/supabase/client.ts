import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Supabase client for Client Components and browser-side code.
 *
 * Usage:
 * ```tsx
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 *
 * export function ProductList() {
 *   const supabase = createClient()
 *   const { data } = await supabase.from('products').select('*')
 *   // ...
 * }
 * ```
 *
 * @returns Typed Supabase client for browser use
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface PosVariant {
    id: string
    name: string
    sku: string
    sellingPrice: number
    capitalCost: number
    stock: number
}

export interface PosProduct {
    id: string
    name: string
    brand: string | null
    categoryName: string | null
    categoryId: string | null
    variants: PosVariant[]
}

export interface PosProductFilters {
    branchId: string
    search?: string
    categoryId?: string
}

export function usePosProducts(filters: PosProductFilters) {
    const supabase = createClient()

    return useQuery<PosProduct[]>({
        queryKey: ['pos-products', filters.branchId, filters.search, filters.categoryId],
        enabled: !!filters.branchId,
        queryFn: async () => {
            // 1. Fetch active products with category name
            let productQuery = supabase
                .from('products')
                .select(`
          id,
          name,
          brand,
          category_id,
          product_categories!left(name)
        `)
                .eq('is_active', true)
                .is('deleted_at', null)
                .order('name')

            if (filters.categoryId) {
                productQuery = productQuery.eq('category_id', filters.categoryId)
            }

            const { data: products, error: productError } = await productQuery

            if (productError) throw productError
            if (!products || products.length === 0) return []

            const productIds = products.map((p) => p.id)

            // 2. Fetch active variants for those products
            const { data: variants, error: variantError } = await supabase
                .from('product_variants')
                .select('id, product_id, name, sku, selling_price, capital_cost')
                .in('product_id', productIds)
                .eq('is_active', true)
                .is('deleted_at', null)
                .order('name')

            if (variantError) throw variantError

            const variantIds = (variants || []).map((v) => v.id)

            // 3. Fetch inventory for the selected branch
            let inventoryMap = new Map<string, number>()
            if (variantIds.length > 0) {
                const { data: inventory, error: inventoryError } = await supabase
                    .from('inventory')
                    .select('product_variant_id, quantity')
                    .eq('branch_id', filters.branchId)
                    .in('product_variant_id', variantIds)

                if (inventoryError) throw inventoryError

                for (const inv of inventory || []) {
                    inventoryMap.set(inv.product_variant_id, inv.quantity)
                }
            }

            // 4. Combine: product -> variants[] with stock from inventory
            const variantsByProduct = new Map<string, PosVariant[]>()
            for (const v of variants || []) {
                const posVariant: PosVariant = {
                    id: v.id,
                    name: v.name,
                    sku: v.sku,
                    sellingPrice: v.selling_price,
                    capitalCost: v.capital_cost,
                    stock: inventoryMap.get(v.id) ?? 0,
                }
                const existing = variantsByProduct.get(v.product_id) || []
                existing.push(posVariant)
                variantsByProduct.set(v.product_id, existing)
            }

            const result: PosProduct[] = products
                .map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    brand: p.brand,
                    categoryName: p.product_categories?.name || null,
                    categoryId: p.category_id,
                    variants: variantsByProduct.get(p.id) || [],
                }))
                // Only show products that have at least one active variant
                .filter((p) => p.variants.length > 0)

            // 5. Apply client-side search
            if (filters.search) {
                const term = filters.search.toLowerCase()
                return result.filter(
                    (p) =>
                        p.name.toLowerCase().includes(term) ||
                        (p.brand && p.brand.toLowerCase().includes(term)) ||
                        p.variants.some(
                            (v) =>
                                v.name.toLowerCase().includes(term) ||
                                v.sku.toLowerCase().includes(term)
                        )
                )
            }

            return result
        },
    })
}

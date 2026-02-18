'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Branch } from '@/types'

export function useBranches() {
    const supabase = createClient()

    return useQuery<Branch[]>({
        queryKey: ['branches'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('branches')
                .select('id, name, is_default')
                .eq('is_active', true)
                .order('is_default', { ascending: false })
                .order('name')

            if (error) throw error
            return data || []
        },
    })
}


import { BranchList } from '@/components/branch/branch-list'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'




export default async function BranchesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    redirect('/dashboard')
  }

  const { data: branches } = await supabase
    .from('branches')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })

  return (
    <div className="container max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Branch Management</h1>
          <p className="text-muted-foreground">
            Manage your shop locations and settings.
          </p>
        </div>
      </div>

      <BranchList branches={branches ?? []} />
    </div>
  )
}
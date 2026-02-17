import { BranchList } from '@/components/branch/branch-list'
import { CreateBranchDialog } from '@/components/branch/create-branch-dialog'
import { PageContainer } from '@/components/layouts/page-container'
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
    <PageContainer
      title="Branch Management"
      subtitle="Manage your shop locations and settings."
      action={<CreateBranchDialog />}
    >
      <BranchList branches={branches ?? []} />
    </PageContainer>
  )
}

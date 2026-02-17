import { StaffList } from '@/components/staff/staff-list'
import { CreateStaffDialog } from '@/components/staff/create-staff-dialog'
import { PageContainer } from '@/components/layouts/page-container'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function StaffPage() {
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

  const { data: staffMembers } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'staff')
    .order('created_at', { ascending: false })

  return (
    <PageContainer
      title="Staff Management"
      subtitle="Manage your staff members, permissions, and PIN access"
      action={<CreateStaffDialog />}
    >
      <StaffList staffMembers={staffMembers ?? []} />
    </PageContainer>
  )
}

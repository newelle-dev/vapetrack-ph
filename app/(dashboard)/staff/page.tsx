import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StaffList } from './staff-list'

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
    <div className="container max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage your staff members, permissions, and PIN access
          </p>
        </div>
      </div>

      <StaffList staffMembers={staffMembers ?? []} />
    </div>
  )
}

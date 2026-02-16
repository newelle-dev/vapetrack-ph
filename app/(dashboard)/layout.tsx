import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayoutClient } from './layout-client'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      role,
      can_view_profits,
      can_manage_inventory,
      can_view_reports,
      organization:organizations (
        id,
        name,
        slug,
        subscription_status
      )
    `)
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return (
    <DashboardLayoutClient
      userFullName={profile.full_name}
      userRole={profile.role}
      canManageInventory={profile.can_manage_inventory ?? false}
      canViewReports={profile.can_view_reports ?? false}
    >
      {children}
    </DashboardLayoutClient>
  )
}
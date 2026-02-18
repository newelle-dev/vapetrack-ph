import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { DashboardLayoutClient } from './layout-client'
import { StaffLayoutClient } from './layout-staff'
import { verifyStaffJwt } from '@/lib/auth/jwt'

const STAFF_SESSION_COOKIE = 'sb-staff-token'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Try staff JWT if no Supabase user
  if (!user) {
    const cookieStore = await cookies()
    const staffToken = cookieStore.get(STAFF_SESSION_COOKIE)?.value

    if (!staffToken) {
      redirect('/login')
    }

    const staffPayload = await verifyStaffJwt(staffToken)
    if (!staffPayload) {
      // Expired or invalid token — clear cookie and redirect
      cookieStore.delete(STAFF_SESSION_COOKIE)
      redirect('/login')
    }

    // Use service client to fetch staff profile (staff JWT is custom, not Supabase auth)
    const serviceClient = createServiceClient()
    const { data: profile } = await serviceClient
      .from('users')
      .select(`
        id,
        full_name,
        role,
        is_active,
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
      .eq('id', staffPayload.sub)
      .single()

    if (!profile || !profile.is_active) {
      cookieStore.delete(STAFF_SESSION_COOKIE)
      redirect('/login')
    }

    return (
      <StaffLayoutClient
        userFullName={profile.full_name}
        userRole={profile.role}
        canManageInventory={profile.can_manage_inventory ?? false}
      >
        {children}
      </StaffLayoutClient>
    )
  }

  // Standard Supabase auth path (owner flow)
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

  // Use simplified staff layout for staff users
  if (profile.role === 'staff') {
    return (
      <StaffLayoutClient
        userFullName={profile.full_name}
        userRole={profile.role}
        canManageInventory={profile.can_manage_inventory ?? false}
      >
        {children}
      </StaffLayoutClient>
    )
  }

  // Use full dashboard layout for owners
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

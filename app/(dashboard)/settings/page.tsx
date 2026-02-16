import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrganizationSettingsForm } from './organization-settings-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select(`
      id,
      role,
      organization:organizations (
        id,
        name,
        slug,
        owner_email,
        address,
        phone,
        subscription_status,
        created_at
      )
    `)
    .eq('id', user.id)
    .single()

  if (!profile?.organization) {
    redirect('/dashboard')
  }

  const org = profile.organization

  return (
    <div className="container max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground">
          Manage your shop details and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shop Information</CardTitle>
          <CardDescription>
            Update your shop name, address, and contact details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationSettingsForm
            organization={{
              id: org.id,
              name: org.name,
              slug: org.slug,
              ownerEmail: org.owner_email,
              address: org.address ?? '',
              phone: org.phone ?? '',
              subscriptionStatus: org.subscription_status ?? 'trial',
              createdAt: org.created_at,
            }}
            isOwner={profile.role === 'owner'}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Read-Only Information</CardTitle>
          <CardDescription>
            System information that cannot be changed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <div className="text-sm font-medium">Shop Slug</div>
            <div className="text-sm text-muted-foreground">{org.slug}</div>
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium">Owner Email</div>
            <div className="text-sm text-muted-foreground">{org.owner_email}</div>
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium">Subscription Status</div>
            <div className="text-sm text-muted-foreground capitalize">
              {org.subscription_status ?? 'trial'}
            </div>
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium">Created</div>
            <div className="text-sm text-muted-foreground">
              {new Date(org.created_at).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
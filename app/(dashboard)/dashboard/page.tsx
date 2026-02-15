import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { signOut } from '@/app/actions/auth'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Get user profile with organization details
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      email,
      role,
      organization:organizations (
        id,
        name,
        slug,
        subscription_status
      )
    `)
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Profile fetch error:', profileError)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.full_name}!</p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium">Name:</span>
              <p className="text-sm text-muted-foreground">{profile?.full_name}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Email:</span>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Role:</span>
              <p className="text-sm text-muted-foreground capitalize">{profile?.role}</p>
            </div>
            <div>
              <span className="text-sm font-medium">User ID:</span>
              <p className="text-xs text-muted-foreground font-mono">{profile?.id}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization Information</CardTitle>
            <CardDescription>Your shop details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium">Shop Name:</span>
              <p className="text-sm text-muted-foreground">{profile?.organization?.name}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Shop Slug:</span>
              <p className="text-sm text-muted-foreground">{profile?.organization?.slug}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Subscription:</span>
              <p className="text-sm text-muted-foreground capitalize">
                {profile?.organization?.subscription_status}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium">Organization ID:</span>
              <p className="text-xs text-muted-foreground font-mono">
                {profile?.organization?.id}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🎉 Authentication Setup Complete!</CardTitle>
          <CardDescription>Multi-tenant authentication is working</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You&apos;ve successfully implemented signup, login, and logout functionality with
            Row-Level Security (RLS) enforcing tenant isolation. Your organization data
            is automatically filtered based on your JWT claims.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
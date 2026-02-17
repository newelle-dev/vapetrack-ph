'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  organizationUpdateSchema,
  type OrganizationUpdateInput,
} from '@/lib/validations/organization'
import { updateOrganization } from '@/app/actions/organizations'

interface OrganizationSettingsFormProps {
  organization: {
    id: string
    name: string
    slug: string
    ownerEmail: string
    address: string
    phone: string
    subscriptionStatus: string
    createdAt: string
  }
  isOwner: boolean
}

export function OrganizationSettingsForm({
  organization,
  isOwner,
}: OrganizationSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<OrganizationUpdateInput>({
    resolver: zodResolver(organizationUpdateSchema),
    defaultValues: {
      name: organization.name,
      address: organization.address,
      phone: organization.phone,
    },
  })

  async function onSubmit(data: OrganizationUpdateInput) {
    setIsLoading(true)

    try {
      const result = await updateOrganization(data)

      if (result.success) {
        toast.success('Organization updated successfully')
      } else {
        toast.error(result.error || 'Failed to update organization')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Update error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOwner) {
    return (
      <div className="text-sm text-muted-foreground">
        Only organization owners can edit these settings.
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shop Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="My Vape Shop"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="123 Main St, Manila"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input
                  placeholder="+63 912 345 6789"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  )
}

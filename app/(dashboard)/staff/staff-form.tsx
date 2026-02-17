'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

const staffFormSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  pin: z
    .string()
    .regex(/^\d{4,6}$/, 'PIN must be 4-6 digits')
    .optional()
    .or(z.literal('')),
  is_active: z.boolean().default(true),
  can_manage_inventory: z.boolean().default(false),
  can_view_profits: z.boolean().default(false),
  can_view_reports: z.boolean().default(false),
})

type StaffFormValues = z.infer<typeof staffFormSchema>

interface StaffFormProps {
  staff?: {
    id: string
    full_name: string
    email: string | null
    pin: string | null
    is_active: boolean | null
    can_manage_inventory: boolean | null
    can_view_profits: boolean | null
    can_view_reports: boolean | null
  }
  onSuccess: () => void
}

export function StaffForm({ staff, onSuccess }: StaffFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<StaffFormValues>({  
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      full_name: staff?.full_name || '',
      email: staff?.email || '',
      pin: '', // Don't prefill PIN for security
      is_active: staff?.is_active ?? true,
      can_manage_inventory: staff?.can_manage_inventory ?? false,
      can_view_profits: staff?.can_view_profits ?? false,
      can_view_reports: staff?.can_view_reports ?? false,
    },
  })

  const onSubmit = (data: StaffFormValues) => {
    startTransition(async () => {
      try {
        // TODO: Implement createStaff or updateStaff action
        console.log('Staff data:', data)
        toast.error('Staff actions not yet implemented')
        // toast.success(staff ? 'Staff member updated' : 'Staff member created')
        // router.refresh()
        // onSuccess()
      } catch (error) {
        toast.error('An error occurred')
        console.error('Staff form error:', error)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Juan Dela Cruz" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="staff@example.com"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Email is optional. Staff can login with PIN only.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {staff ? 'New PIN (leave blank to keep current)' : 'PIN'}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="4-6 digit PIN"
                  maxLength={6}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                4-6 digit PIN for quick staff login on POS
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="font-semibold">Permissions</h3>

          <FormField
            control={form.control}
            name="can_manage_inventory"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Manage Inventory</FormLabel>
                  <FormDescription>
                    Can add, edit, and update stock levels
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="can_view_profits"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">View Profits</FormLabel>
                  <FormDescription>
                    Can see profit margins and financial data
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="can_view_reports"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">View Reports</FormLabel>
                  <FormDescription>
                    Can access sales reports and analytics
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active Status</FormLabel>
                  <FormDescription>
                    Staff member can login when active
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : staff ? 'Update Staff' : 'Create Staff'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

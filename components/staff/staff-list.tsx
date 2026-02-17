'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Key } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { StaffForm } from './staff-form'

interface StaffMember {
  id: string
  full_name: string
  email: string | null
  pin: string | null
  role: string
  is_active: boolean | null
  can_manage_inventory: boolean | null
  can_view_profits: boolean | null
  can_view_reports: boolean | null
  last_login_at: string | null
  created_at: string
}

interface StaffListProps {
  staffMembers: StaffMember[]
}

export function StaffList({ staffMembers }: StaffListProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = (staff: StaffMember) => {
    setEditingStaff(staff)
    setEditDialogOpen(true)
  }

  const handleDelete = (staffId: string) => {
    setDeletingStaffId(staffId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingStaffId) return

    setIsDeleting(true)

    try {
      // TODO: Implement deleteStaff action
      toast.error('Delete functionality not yet implemented')
      setDeleteDialogOpen(false)
      setDeletingStaffId(null)
      // router.refresh()
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Delete error:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>

      {staffMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center bg-card">
          <p className="text-lg font-medium">No staff members yet</p>
          <p className="text-sm text-muted-foreground">
            Get started by adding your first staff member.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile cards */}
          <div className="space-y-4 md:hidden">
            {staffMembers.map((staff) => (
              <div
                key={staff.id}
                className="rounded-xl border bg-card p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{staff.full_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {staff.email || 'No email'}
                    </p>
                  </div>
                  <Badge variant={staff.is_active ? 'default' : 'secondary'}>
                    {staff.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  {staff.can_manage_inventory && (
                    <Badge variant="outline" className="text-xs">
                      Inventory
                    </Badge>
                  )}
                  {staff.can_view_profits && (
                    <Badge variant="outline" className="text-xs">
                      Profits
                    </Badge>
                  )}
                  {staff.can_view_reports && (
                    <Badge variant="outline" className="text-xs">
                      Reports
                    </Badge>
                  )}
                  {staff.pin && (
                    <Badge variant="outline" className="text-xs">
                      <Key className="mr-1 size-3" />
                      PIN Set
                    </Badge>
                  )}
                </div>

                {staff.last_login_at && (
                  <p className="text-xs text-muted-foreground">
                    Last login: {new Date(staff.last_login_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 touch-target"
                    onClick={() => handleEdit(staff)}
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive touch-target px-4"
                    onClick={() => handleDelete(staff.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>PIN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffMembers.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">
                      {staff.full_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {staff.email || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {staff.can_manage_inventory && (
                          <Badge variant="outline" className="text-xs">
                            Inventory
                          </Badge>
                        )}
                        {staff.can_view_profits && (
                          <Badge variant="outline" className="text-xs">
                            Profits
                          </Badge>
                        )}
                        {staff.can_view_reports && (
                          <Badge variant="outline" className="text-xs">
                            Reports
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {staff.pin ? (
                        <Badge variant="outline" className="text-xs">
                          <Key className="mr-1 size-3" />
                          Set
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={staff.is_active ? 'default' : 'secondary'}>
                        {staff.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {staff.last_login_at
                        ? new Date(staff.last_login_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(staff)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(staff.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member information and permissions.
            </DialogDescription>
          </DialogHeader>
          {editingStaff && (
            <StaffForm
              staff={editingStaff}
              onSuccess={() => {
                setEditDialogOpen(false)
                setEditingStaff(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the staff
              member&apos;s access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

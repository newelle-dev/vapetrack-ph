'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { toast } from 'sonner'

interface HeaderProps {
  userFullName: string
  userRole: string
  onMenuClick: () => void
  alwaysShowMenu?: boolean
}

export function Header({ userFullName, userRole, onMenuClick, alwaysShowMenu = false }: HeaderProps) {
  const router = useRouter()

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Error logging out')
      console.error('Logout error:', error)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-[60px] items-center justify-between px-4 md:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "min-w-[44px] min-h-[44px]",
            !alwaysShowMenu && "md:hidden"
          )}
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Logo/Brand */}
        <div className="flex items-center gap-2 md:flex-1">
          <span className="text-base font-semibold">VapeTrack PH</span>
        </div>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 gap-2 rounded-full px-2 min-w-[44px] min-h-[44px]">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(userFullName)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline-block">
                {userFullName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userFullName}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {userRole === 'staff' && (
              <DropdownMenuItem
                onClick={() => router.push('/dashboard')}
                className="cursor-pointer"
              >
                My Sales Today
              </DropdownMenuItem>
            )}
            {userRole === 'owner' && (
              <DropdownMenuItem
                onClick={() => router.push('/dashboard/settings')}
                className="cursor-pointer"
              >
                Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

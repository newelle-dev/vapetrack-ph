import {
    Home,
    ShoppingCart,
    Package,
    Building2,
    Users,
    BarChart3,
    Settings,
    type LucideIcon,
} from 'lucide-react'

export interface NavItem {
    label: string
    href: string
    icon: LucideIcon
    show: boolean
    /** Whether to show in mobile bottom nav */
    mobile?: boolean
}

interface NavConfigProps {
    userRole: string
    canManageInventory: boolean
    canViewReports: boolean
}

export function getNavItems({ userRole, canManageInventory, canViewReports }: NavConfigProps): NavItem[] {
    return [
        {
            label: 'Dashboard',
            href: '/dashboard',
            icon: Home,
            show: true,
            mobile: true
        },
        {
            label: 'POS',
            href: '/pos',
            icon: ShoppingCart,
            show: true,
            mobile: true
        },
        {
            label: 'Inventory',
            href: '/inventory',
            icon: Package,
            show: canManageInventory,
            mobile: true
        },
        {
            label: 'Branches',
            href: '/branches',
            icon: Building2,
            show: userRole === 'owner',
            mobile: false
        },
        {
            label: 'Staff',
            href: '/staff',
            icon: Users,
            show: userRole === 'owner',
            mobile: false
        },
        {
            label: 'Reports',
            href: '/reports',
            icon: BarChart3,
            show: canViewReports,
            mobile: true
        },
        {
            label: 'Settings',
            href: '/settings',
            icon: Settings,
            show: userRole === 'owner',
            mobile: true
        },
    ]
}

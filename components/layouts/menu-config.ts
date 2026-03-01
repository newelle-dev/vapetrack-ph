import {
    Home,
    ShoppingCart,
    Package,
    Building2,
    Users,
    BarChart3,
    Settings,
    Tags,
    ArrowRightLeft,
    History,
    type LucideIcon,
} from 'lucide-react'

export interface NavItem {
    label: string
    href: string
    icon: LucideIcon
    show: boolean
    /** Whether to show in mobile bottom nav */
    mobile?: boolean
    /** Optional badge count to display */
    badge?: number
    /** Color of the badge (default: constructive/red) */
    badgeColor?: "default" | "warning" | "destructive"
}

interface NavConfigProps {
    userRole: string
    canManageInventory: boolean
    canViewReports: boolean
    lowStockCount?: number
}

export function getNavItems({ userRole, canManageInventory, canViewReports, lowStockCount = 0 }: NavConfigProps): NavItem[] {
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
            mobile: true,
            badge: lowStockCount > 0 ? lowStockCount : undefined,
            badgeColor: "warning"
        },
        {
            label: 'Categories',
            href: '/inventory/categories',
            icon: Tags,
            show: canManageInventory,
            mobile: true
        },
        {
            label: 'Stock Adjustment',
            href: '/inventory/stock',
            icon: ArrowRightLeft,
            show: canManageInventory,
            mobile: true
        },
        {
            label: 'History',
            href: '/inventory/history',
            icon: History,
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

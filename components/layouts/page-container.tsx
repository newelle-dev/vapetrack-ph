'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
    children: ReactNode
    title?: string
    subtitle?: string
    action?: ReactNode
    className?: string
}

/**
 * PageContainer - Reusable page layout component for consistent spacing and structure
 * 
 * Features:
 * - Consistent padding: 4 (16px) on mobile, 6 (24px) on desktop
 * - Bottom padding to prevent overlap with mobile navigation (80px)
 * - Optional title, subtitle, and action button
 * - Responsive design with mobile-first approach
 */
export function PageContainer({
    children,
    title,
    subtitle,
    action,
    className,
}: PageContainerProps) {
    return (
        <div className={cn('flex-1 space-y-4 p-4 pb-20 md:p-6 md:pb-6', className)}>
            {(title || action) && (
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        {title && (
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                {title}
                            </h1>
                        )}
                        {subtitle && (
                            <p className="text-sm text-muted-foreground">{subtitle}</p>
                        )}
                    </div>
                    {action && <div className="flex items-center gap-2">{action}</div>}
                </div>
            )}
            {children}
        </div>
    )
}

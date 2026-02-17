'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: ReactNode
    title?: string
    subtitle?: string
    action?: ReactNode
    className?: string
    /** Full height layout - adds h-full class for pages that need to fill viewport */
    fullHeight?: boolean
    /** Sticky content positioned at top of viewport (below header) */
    stickyTop?: ReactNode
    /** Removes top padding when page has custom header */
    noPaddingTop?: boolean
}

/**
 * PageContainer - Reusable page layout component for consistent spacing and structure
 * 
 * Features:
 * - Consistent padding: 4 (16px) on mobile, 6 (24px) on desktop
 * - Bottom padding to prevent overlap with mobile navigation (80px on mobile)
 * - Optional title, subtitle, and action button
 * - Responsive design with mobile-first approach
 * - Full-height support for special layouts (e.g., POS)
 * - Sticky top content support
 * 
 * Standard Border Radius: rounded-xl (12px) for cards and containers
 * 
 * @example
 * // Basic usage
 * <PageContainer title="Dashboard" subtitle="Today's overview">
 *   <div>Content here</div>
 * </PageContainer>
 * 
 * @example
 * // Full height with sticky top content (POS screen)
 * <PageContainer fullHeight noPaddingTop stickyTop={<SearchBar />}>
 *   <div>Scrollable content</div>
 * </PageContainer>
 */
export function PageContainer({
    children,
    title,
    subtitle,
    action,
    className,
    fullHeight = false,
    stickyTop,
    noPaddingTop = false,
    style,
    ...props
}: PageContainerProps) {
    return (
        <div
            className={cn(
                'flex-1 space-y-4',
                fullHeight ? 'h-full flex flex-col' : '',
                noPaddingTop ? 'p-0' : 'p-4 md:p-6',
                // Remove the static pb-20 class, we will handle it via style
                !noPaddingTop && 'md:pb-6',
                className
            )}
            style={{
                // Apply dynamic bottom padding on mobile (md: breakpoint handles desktop reset via class)
                paddingBottom: !noPaddingTop ? 'var(--safe-area-bottom)' : undefined,
                ...style
            }}
            {...props}

        >
            {/* Sticky top content (optional) */}
            {stickyTop && (
                <div className="sticky top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                    {stickyTop}
                </div>
            )}

            {/* Page header (title + action) */}
            {(title || action) && (
                <div className={cn('flex items-center justify-between', noPaddingTop && 'px-4 pt-4 md:px-6 md:pt-6')}>
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

            {/* Main content */}
            <div className={cn(fullHeight && 'flex-1 overflow-y-auto', noPaddingTop && 'px-4 pb-20 md:px-6 md:pb-6')}>
                {children}
            </div>
        </div>
    )
}

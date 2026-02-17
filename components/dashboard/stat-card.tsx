import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
    title: string
    value: string | number
    subtext?: string
    icon?: LucideIcon
    valueColor?: string
    className?: string
}

export function StatCard({
    title,
    value,
    subtext,
    icon: Icon,
    valueColor = 'text-foreground',
    className,
}: StatCardProps) {
    return (
        <div
            className={cn(
                'bg-card rounded-xl p-3 border border-border/50 hover:border-border transition-colors',
                className
            )}
        >
            <div className="flex justify-between items-start">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1.5">
                    {title}
                </p>
                {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
            </div>
            <h3 className={cn('text-2xl font-bold mb-1', valueColor)}>
                {typeof value === 'number' ? `₱${value.toLocaleString()}` : value}
            </h3>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
        </div>
    )
}

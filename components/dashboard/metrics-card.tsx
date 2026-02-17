import { LucideIcon, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricsCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    trend?: {
        value: number
        label?: string
        isPositive?: boolean
    }
    subValue?: {
        label: string
        value: string
    }
    className?: string
    gradient?: string
}

export function MetricsCard({
    title,
    value,
    icon: Icon,
    trend,
    subValue,
    className,
    gradient = 'from-emerald-500 to-emerald-700',
}: MetricsCardProps) {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-xl p-4 border border-white/10 shadow-xl',
                `bg-gradient-to-br ${gradient}`,
                className
            )}
        >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative flex items-start justify-between mb-4">
                <div>
                    <p className="text-xs text-white/90 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" />
                        {title}
                    </p>
                    <h2 className="text-4xl font-black text-white mt-2 flex items-baseline gap-1">
                        {typeof value === 'number' ? (
                            <>
                                <span className="text-2xl font-medium opacity-90">₱</span>
                                {value.toLocaleString()}
                            </>
                        ) : (
                            value
                        )}
                    </h2>
                </div>
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/20">
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>

            <div className="relative flex items-center gap-2">
                {trend && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg border border-white/10">
                        <TrendingUp className="w-3.5 h-3.5 text-white" />
                        <span className="text-xs font-bold text-white">
                            {trend.value > 0 ? '+' : ''}
                            {trend.value}% {trend.label || 'growth'}
                        </span>
                    </div>
                )}
                {subValue && (
                    <>
                        <div className="h-4 w-px bg-white/20" />
                        <p className="text-xs text-white/90 font-medium">
                            {subValue.label}:{' '}
                            <span className="text-white font-bold">{subValue.value}</span>
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}

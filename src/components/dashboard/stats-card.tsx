import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    label?: string
  }
  iconClassName?: string
  className?: string
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  iconClassName,
  className,
}: StatsCardProps) {
  const isPositive = trend && trend.value >= 0

  return (
    <div
      className={cn(
        'bg-white border border-zinc-200 rounded-lg shadow-sm p-5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-zinc-800 tabular-nums">
            {value}
          </p>
        </div>
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            iconClassName ?? 'bg-amber-50'
          )}
        >
          <Icon
            size={20}
            className={cn(
              iconClassName ? 'text-current' : 'text-amber-600'
            )}
          />
        </div>
      </div>

      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          {isPositive ? (
            <TrendingUp size={13} className="text-emerald-500" />
          ) : (
            <TrendingDown size={13} className="text-rose-500" />
          )}
          <span
            className={cn(
              'text-xs font-medium',
              isPositive ? 'text-emerald-600' : 'text-rose-600'
            )}
          >
            {isPositive ? '+' : ''}
            {trend.value}%
          </span>
          {trend.label && (
            <span className="text-xs text-zinc-400">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  )
}

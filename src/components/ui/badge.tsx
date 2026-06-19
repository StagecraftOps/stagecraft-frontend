import { cn } from '@/lib/utils'

type BadgeStatus =
  | 'success'
  | 'failure'
  | 'in_progress'
  | 'queued'
  | 'skipped'
  | 'cancelled'
  | 'timed_out'
  | 'action_required'
  | 'pending'
  | 'analyzing'
  | 'completed'
  | 'failed'
  | 'active'
  | 'disabled_manually'
  | 'disabled_inactivity'

interface BadgeProps {
  status: BadgeStatus | string
  label?: string
  className?: string
  showDot?: boolean
}

const statusConfig: Record<
  string,
  { label: string; className: string; dotClass: string }
> = {
  success: {
    label: 'Success',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  active: {
    label: 'Active',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  failure: {
    label: 'Failed',
    className: 'bg-rose-50 text-rose-700 border border-rose-200',
    dotClass: 'bg-rose-500',
  },
  failed: {
    label: 'Failed',
    className: 'bg-rose-50 text-rose-700 border border-rose-200',
    dotClass: 'bg-rose-500',
  },
  timed_out: {
    label: 'Timed out',
    className: 'bg-rose-50 text-rose-700 border border-rose-200',
    dotClass: 'bg-rose-500',
  },
  action_required: {
    label: 'Action required',
    className: 'bg-orange-50 text-orange-700 border border-orange-200',
    dotClass: 'bg-orange-400',
  },
  in_progress: {
    label: 'In progress',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
    dotClass: 'bg-amber-500 animate-pulse',
  },
  analyzing: {
    label: 'Analyzing',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
    dotClass: 'bg-amber-500 animate-pulse',
  },
  analyzed: {
    label: 'Ready',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  pr_raised: {
    label: 'PR raised',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  helpful: {
    label: 'Accepted ✓',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
    dotClass: 'bg-amber-400 animate-pulse',
  },
  queued: {
    label: 'Queued',
    className: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
    dotClass: 'bg-zinc-400',
  },
  waiting: {
    label: 'Waiting',
    className: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
    dotClass: 'bg-zinc-400',
  },
  skipped: {
    label: 'Skipped',
    className: 'bg-zinc-100 text-zinc-500 border border-zinc-200',
    dotClass: 'bg-zinc-400',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-zinc-100 text-zinc-500 border border-zinc-200',
    dotClass: 'bg-zinc-400',
  },
  neutral: {
    label: 'Neutral',
    className: 'bg-zinc-100 text-zinc-500 border border-zinc-200',
    dotClass: 'bg-zinc-400',
  },
  disabled_manually: {
    label: 'Disabled',
    className: 'bg-zinc-100 text-zinc-500 border border-zinc-200',
    dotClass: 'bg-zinc-400',
  },
  disabled_inactivity: {
    label: 'Inactive',
    className: 'bg-zinc-100 text-zinc-500 border border-zinc-200',
    dotClass: 'bg-zinc-400',
  },
}

const defaultConfig = {
  label: 'Unknown',
  className: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
  dotClass: 'bg-zinc-400',
}

export function Badge({ status, label, className, showDot = true }: BadgeProps) {
  const config = statusConfig[status] ?? defaultConfig
  const displayLabel = label ?? config.label

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      {showDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dotClass)} />
      )}
      {displayLabel}
    </span>
  )
}

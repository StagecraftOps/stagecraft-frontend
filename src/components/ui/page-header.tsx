import type { ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="font-code text-[11px] uppercase tracking-[0.18em] text-amber-600 dark:text-amber-500 mb-1">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif-display text-3xl leading-tight text-zinc-900 dark:text-zinc-100">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}

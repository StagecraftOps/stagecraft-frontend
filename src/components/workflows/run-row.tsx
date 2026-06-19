import Link from 'next/link'
import { GitBranch, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime, calculateDuration, formatSha, truncate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { WorkflowRun } from '@/types'

interface RunRowProps {
  run: WorkflowRun
  showWorkflow?: boolean
  showRepo?: boolean
  className?: string
}

export function RunRow({ run, showWorkflow = true, showRepo = true, className }: RunRowProps) {
  const displayStatus =
    run.status === 'completed' ? (run.conclusion ?? 'neutral') : run.status

  return (
    <tr className={cn('hover:bg-zinc-50 transition-colors', className)}>
      {showWorkflow && (
        <td className="py-3 px-4 text-sm">
          <Link
            href={`/runs/${run.id}`}
            className="font-medium text-zinc-800 hover:text-amber-700 transition-colors"
          >
            {truncate(run.workflow_name ?? `Run #${run.github_run_id}`, 40)}
          </Link>
        </td>
      )}
      {showRepo && (
        <td className="py-3 px-4 text-sm text-zinc-500">
          {run.repo_name ?? '—'}
        </td>
      )}
      <td className="py-3 px-4">
        <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
          <GitBranch size={11} className="text-zinc-400" />
          <span className="truncate max-w-[120px]">{run.branch}</span>
        </span>
      </td>
      <td className="py-3 px-4">
        <code className="text-xs text-zinc-400 font-mono bg-zinc-50 px-1.5 py-0.5 rounded">
          {formatSha(run.head_sha)}
        </code>
      </td>
      <td className="py-3 px-4">
        <Badge status={displayStatus} />
      </td>
      <td className="py-3 px-4 text-xs text-zinc-500 tabular-nums">
        {run.started_at ? calculateDuration(run.started_at, run.completed_at) : '—'}
      </td>
      <td className="py-3 px-4 text-xs text-zinc-400">
        {run.started_at ? formatRelativeTime(run.started_at) : '—'}
      </td>
      <td className="py-3 px-4">
        {run.html_url && (
          <a
            href={run.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-amber-600 transition-colors"
          >
            <ExternalLink size={13} />
          </a>
        )}
      </td>
    </tr>
  )
}

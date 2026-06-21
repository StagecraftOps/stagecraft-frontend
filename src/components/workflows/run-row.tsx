'use client'

import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const displayStatus =
    run.status === 'completed' ? (run.conclusion ?? 'neutral') : run.status

  return (
    <tr
      onClick={() => router.push(`/runs/${run.id}`)}
      className={cn('hover:bg-zinc-50 transition-colors cursor-pointer', className)}
    >
      {showWorkflow && (
        <td className="py-3 px-4 text-sm">
          <span className="font-medium text-zinc-800">
            {truncate(run.workflow_name ?? `Run #${run.github_run_id}`, 40)}
          </span>
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
            onClick={(e) => e.stopPropagation()}
            className="text-zinc-400 hover:text-amber-600 transition-colors"
          >
            <ExternalLink size={13} />
          </a>
        )}
      </td>
    </tr>
  )
}

import Link from 'next/link'
import { GitBranch, Clock, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime, calculateDuration } from '@/lib/utils'
import type { Workflow, WorkflowRun } from '@/types'

interface WorkflowCardProps {
  workflow: Workflow
  lastRun?: WorkflowRun
  org: string
}

export function WorkflowCard({ workflow, lastRun, org }: WorkflowCardProps) {
  const repoName = workflow.repo_name
  const href = `/workflows/${org}/${repoName}`

  const getDisplayStatus = () => {
    if (!lastRun) return null
    if (lastRun.status === 'completed') {
      return lastRun.conclusion ?? 'neutral'
    }
    return lastRun.status
  }

  const displayStatus = getDisplayStatus()

  return (
    <Link href={href}>
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-5 hover:border-zinc-300 hover:shadow-md transition-all group cursor-pointer">
        {}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-400 font-medium truncate mb-1">
              {repoName}
            </p>
            <h3 className="text-sm font-semibold text-zinc-800 truncate group-hover:text-amber-700 transition-colors">
              {workflow.name}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 truncate font-mono">
              {workflow.path}
            </p>
          </div>
          <ArrowRight
            size={14}
            className="text-zinc-300 group-hover:text-amber-500 transition-colors flex-shrink-0 mt-1"
          />
        </div>

        {}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {displayStatus ? (
              <Badge status={displayStatus} />
            ) : (
              <Badge status="skipped" label="No runs" />
            )}
          </div>

          {lastRun && (
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              {lastRun.branch && (
                <span className="flex items-center gap-1">
                  <GitBranch size={11} />
                  <span className="truncate max-w-[80px]">{lastRun.branch}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {lastRun.started_at
                  ? formatRelativeTime(lastRun.started_at)
                  : '—'}
              </span>
            </div>
          )}
        </div>

        {lastRun && lastRun.started_at && (
          <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
            <span>Duration: {calculateDuration(lastRun.started_at, lastRun.completed_at)}</span>
          </div>
        )}
      </div>
    </Link>
  )
}

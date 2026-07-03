import { Zap } from 'lucide-react'
import type { JobRunData, CriticalPathData } from '@/types'

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

interface JobTimelineProps {
  jobs: JobRunData[]
  criticalPath: CriticalPathData | null
}

export function JobTimeline({ jobs, criticalPath }: JobTimelineProps) {
  if (jobs.length === 0) {
    return <p className="text-sm text-zinc-400 py-4 text-center">No per-job timing data yet.</p>
  }

  const maxDuration = Math.max(...jobs.map((j) => j.duration_seconds ?? 0), 1)
  const criticalIds = new Set(criticalPath?.critical_path_job_ids ?? [])

  return (
    <div className="space-y-2">
      {jobs.map((job) => {
        const onCriticalPath = criticalIds.has(job.id)
        const isLongest = criticalPath?.longest_job_id === job.id
        const width = ((job.duration_seconds ?? 0) / maxDuration) * 100

        return (
          <div key={job.id} className="flex items-center gap-3">
            <div className="w-40 flex-shrink-0 truncate text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
              {isLongest && <Zap size={11} className="text-amber-500 flex-shrink-0" />}
              {job.job_name}
            </div>
            <div className="flex-1 h-5 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
              <div
                className={
                  onCriticalPath
                    ? 'h-full bg-amber-500 rounded'
                    : 'h-full bg-zinc-400 dark:bg-zinc-600 rounded'
                }
                style={{ width: `${Math.max(width, 2)}%` }}
              />
            </div>
            <div className="w-16 flex-shrink-0 text-right text-xs font-mono text-zinc-500">
              {formatDuration(job.duration_seconds)}
            </div>
          </div>
        )
      })}
      {criticalPath && (
        <p className="text-xs text-zinc-400 pt-2">
          Critical path total: <span className="font-mono">{formatDuration(criticalPath.total_duration_seconds)}</span>
          {' '}— amber bars are on the critical path, the lightning bolt marks the single longest job.
        </p>
      )}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SkeletonCard } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/ui/page-header'
import { useOrg } from '@/lib/org-context'
import { fetchLongestJobs, fetchLongestWorkflows, fetchRunnerBreakdown } from '@/lib/api'

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  return `${m}m ${seconds % 60}s`
}

export default function PerformancePage() {
  const { currentOrg } = useOrg()

  const { data: longestJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['longest-jobs', currentOrg],
    queryFn: () => fetchLongestJobs(currentOrg),
    enabled: Boolean(currentOrg),
  })

  const { data: longestWorkflows = [], isLoading: workflowsLoading } = useQuery({
    queryKey: ['longest-workflows', currentOrg],
    queryFn: () => fetchLongestWorkflows(currentOrg),
    enabled: Boolean(currentOrg),
  })

  const { data: runnerBreakdown = [], isLoading: runnersLoading } = useQuery({
    queryKey: ['runner-breakdown', currentOrg],
    queryFn: () => fetchRunnerBreakdown(currentOrg),
    enabled: Boolean(currentOrg),
  })

  const totalJobs = runnerBreakdown.reduce((sum, r) => sum + r.job_count, 0)

  return (
    <div className="p-8">
      <PageHeader
        eyebrow="Overview"
        title="Runtime Performance"
        description="Longest-running jobs and workflows — pure duration ranking, no AI involved."
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Longest-Running Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <SkeletonCard />
            ) : longestJobs.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-zinc-400 text-sm">
                No job timing data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={longestJobs} layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} />
                  <YAxis
                    dataKey="job_name"
                    type="category"
                    width={120}
                    tick={{ fontSize: 11, fill: '#52525b' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip formatter={(v: number) => formatDuration(v)} />
                  <Bar dataKey="duration_seconds" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Duration" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Longest-Running Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            {workflowsLoading ? (
              <SkeletonCard />
            ) : longestWorkflows.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-zinc-400 text-sm">
                No workflow timing data yet.
              </div>
            ) : (
              <ul className="space-y-2">
                {longestWorkflows.map((wf) => (
                  <li key={wf.workflow_run_id}>
                    <Link
                      href={`/runs/${wf.workflow_run_id}`}
                      className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                          {wf.workflow_name}
                        </p>
                        <p className="text-xs text-zinc-400">{wf.repo_name}</p>
                      </div>
                      <span className="text-sm font-mono text-zinc-500 flex-shrink-0 ml-3">
                        {formatDuration(wf.duration_seconds)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Runner Breakdown</CardTitle>
          <CardDescription>Jobs grouped by runner type, synced from GitHub&apos;s Jobs API labels.</CardDescription>
        </CardHeader>
        <CardContent>
          {runnersLoading ? (
            <SkeletonCard />
          ) : runnerBreakdown.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-zinc-400 text-sm">
              No runner data yet.
            </div>
          ) : (
            <div className="space-y-2">
              {runnerBreakdown.map((r, i) => {
                const unassigned = !r.runner_labels || r.runner_labels.length === 0
                const pct = totalJobs ? (100 * r.job_count) / totalJobs : 0
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-40 flex-shrink-0 flex items-center gap-1.5">
                      {unassigned && <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />}
                      <span className={`text-sm truncate ${unassigned ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-zinc-700 dark:text-zinc-200'}`}>
                        {unassigned ? 'No runner assigned' : r.runner_labels!.join(', ')}
                      </span>
                    </div>
                    <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full ${unassigned ? 'bg-amber-400' : 'bg-blue-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-16 flex-shrink-0 text-right text-xs text-zinc-500 tabular-nums">
                      {r.job_count} job{r.job_count === 1 ? '' : 's'}
                    </span>
                    <span className="w-20 flex-shrink-0 text-right text-xs text-zinc-400 tabular-nums">
                      {r.avg_duration_seconds != null ? formatDuration(Math.round(r.avg_duration_seconds)) : '—'}
                    </span>
                  </div>
                )
              })}
              {runnerBreakdown.some((r) => !r.runner_labels || r.runner_labels.length === 0) && (
                <p className="text-xs text-zinc-400 mt-3">
                  &quot;No runner assigned&quot; means these jobs never got picked up by a runner — usually queue/capacity
                  pressure (too many parallel jobs for available runners), not a sync issue.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

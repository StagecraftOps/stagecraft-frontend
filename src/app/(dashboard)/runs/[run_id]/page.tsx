'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Bot, AlertCircle, GitBranch, Clock, Hash } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchRun, fetchRemediations, fetchRunLogs, fetchRunJobs, fetchRunCriticalPath } from '@/lib/api'
import { LogViewer } from '@/components/workflows/log-viewer'
import { JobTimeline } from '@/components/workflows/job-timeline'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatRelativeTime, calculateDuration, formatSha, truncate } from '@/lib/utils'

export default function RunDetailPage() {
  const params = useParams()
  const runId = params.run_id as string

  const { data: run, isLoading, error } = useQuery({
    queryKey: ['run', runId],
    queryFn: () => fetchRun(runId),
    enabled: Boolean(runId),
  })

  const { data: remediations = [] } = useQuery({
    queryKey: ['remediations'],
    queryFn: fetchRemediations,
  })

  const relatedRemediation = remediations.find(
    (r) => run && r.workflow_run_id === run.id
  )

  const { data: jobs = [] } = useQuery({
    queryKey: ['run-jobs', runId],
    queryFn: () => fetchRunJobs(runId),
    enabled: Boolean(runId),
  })

  const { data: criticalPath = null } = useQuery({
    queryKey: ['run-critical-path', runId],
    queryFn: () => fetchRunCriticalPath(runId),
    enabled: Boolean(runId),
  })

  const [showLogs, setShowLogs] = useState(false)
  const {
    data: logs,
    isLoading: logsLoading,
    error: logsError,
  } = useQuery({
    queryKey: ['run-logs', runId],
    queryFn: () => fetchRunLogs(runId),
    enabled: showLogs && Boolean(runId),
  })

  const displayStatus =
    run?.status === 'completed' ? (run.conclusion ?? 'neutral') : run?.status ?? 'queued'

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (error || !run) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-4">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">
            Failed to load run details. The run may not exist.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {}
      <Link
        href="/runs"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Runs
      </Link>

      {}
      <div className="mb-8">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-zinc-800 truncate">
              {run.workflow_name ?? `Run #${run.github_run_id}`}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Badge status={displayStatus} />
              {run.repo_name && (
                <span className="text-sm text-zinc-500 font-medium">
                  {run.repo_name}
                </span>
              )}
              <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                <GitBranch size={13} />
                {run.branch}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                <Hash size={13} />
                <code className="font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded">
                  {formatSha(run.head_sha)}
                </code>
              </div>
            </div>
          </div>
          {run.html_url && (
            <a
              href={run.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {}
          <Card>
            <CardHeader>
              <CardTitle>Run Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-zinc-400 uppercase tracking-wider mb-1">
                    Run ID
                  </dt>
                  <dd className="text-sm font-mono text-zinc-700">
                    #{run.github_run_id}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-400 uppercase tracking-wider mb-1">
                    Status
                  </dt>
                  <dd>
                    <Badge status={displayStatus} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock size={11} />
                    Started
                  </dt>
                  <dd className="text-sm text-zinc-700">
                    {run.started_at ? formatDate(run.started_at) : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-400 uppercase tracking-wider mb-1">
                    Duration
                  </dt>
                  <dd className="text-sm text-zinc-700 font-mono">
                    {run.started_at
                      ? calculateDuration(run.started_at, run.completed_at)
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-400 uppercase tracking-wider mb-1">
                    Branch
                  </dt>
                  <dd className="text-sm text-zinc-700 flex items-center gap-1.5">
                    <GitBranch size={12} className="text-zinc-400" />
                    {run.branch}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-400 uppercase tracking-wider mb-1">
                    Commit SHA
                  </dt>
                  <dd>
                    <code className="text-xs font-mono bg-zinc-100 text-zinc-700 px-2 py-1 rounded">
                      {run.head_sha}
                    </code>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {}
          {jobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Job Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <JobTimeline jobs={jobs} criticalPath={criticalPath} />
              </CardContent>
            </Card>
          )}

          {}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Workflow Logs</CardTitle>
                {!showLogs && (
                  <button
                    onClick={() => setShowLogs(true)}
                    className="text-xs font-semibold text-amber-600 hover:text-amber-700"
                  >
                    Load logs
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!showLogs ? (
                <div className="text-center py-8">
                  <p className="text-sm text-zinc-400">
                    Click <span className="font-semibold text-zinc-600">Load logs</span> to
                    fetch the workflow output from GitHub (secrets are automatically redacted).
                  </p>
                </div>
              ) : logsLoading ? (
                <div className="space-y-2 py-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <p className="text-xs text-zinc-400 pt-2">
                    Fetching logs from GitHub…
                  </p>
                </div>
              ) : logsError ? (
                <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-md p-3">
                  <AlertCircle size={16} />
                  <p className="text-xs font-medium">
                    Could not load logs. They may have expired (GitHub retains logs ~90 days),
                    or this run has no downloadable logs.
                  </p>
                </div>
              ) : (
                <LogViewer logs={logs || 'No log output.'} />
              )}
            </CardContent>
          </Card>
        </div>

        {}
        <div>
          {}
          {(displayStatus === 'failure' || displayStatus === 'timed_out') && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-amber-100 rounded flex items-center justify-center">
                    <Bot size={13} className="text-amber-600" />
                  </div>
                  <CardTitle>AI Remediation</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {relatedRemediation ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge status={relatedRemediation.status} />
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {truncate(relatedRemediation.root_cause, 120)}
                    </p>
                    {relatedRemediation.pr_url && (
                      <a
                        href={relatedRemediation.pr_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium"
                      >
                        View PR #{relatedRemediation.pr_number}
                        <ExternalLink size={12} />
                      </a>
                    )}
                    <Link
                      href={`/remediation/${relatedRemediation.id}`}
                      className="block text-xs text-zinc-400 hover:text-zinc-600 mt-1"
                    >
                      View full details
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Bot size={16} className="text-amber-500" />
                    </div>
                    <p className="text-xs text-zinc-500">
                      AI analysis is pending for this failure.
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Check back shortly.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-zinc-400 uppercase tracking-wider mb-0.5">
                    Triggered
                  </dt>
                  <dd className="text-sm text-zinc-700">
                    {run.started_at ? formatRelativeTime(run.started_at) : '—'}
                  </dd>
                </div>
                {run.completed_at && (
                  <div>
                    <dt className="text-xs text-zinc-400 uppercase tracking-wider mb-0.5">
                      Completed
                    </dt>
                    <dd className="text-sm text-zinc-700">
                      {formatDate(run.completed_at)}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

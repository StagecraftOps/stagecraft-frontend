'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Gauge } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonCard } from '@/components/ui/skeleton'
import { fetchOrgs, fetchLongestJobs, fetchLongestWorkflows } from '@/lib/api'

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  return `${m}m ${seconds % 60}s`
}

export default function PerformancePage() {
  const [selectedOrg, setSelectedOrg] = useState('')
  const { data: orgs = [] } = useQuery({ queryKey: ['orgs'], queryFn: fetchOrgs })

  useEffect(() => {
    if (orgs.length > 0 && !selectedOrg) setSelectedOrg(orgs[0].login)
  }, [orgs, selectedOrg])

  const currentOrg = selectedOrg || orgs[0]?.login || ''

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

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <Gauge size={20} />
            Runtime Performance
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Longest-running jobs and workflows — pure duration ranking, no AI involved.
          </p>
        </div>
        {orgs.length > 1 && (
          <select
            value={currentOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="text-sm border border-zinc-200 rounded-md bg-white text-zinc-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {orgs.map((org) => (
              <option key={org.login} value={org.login}>
                {org.name || org.login}
              </option>
            ))}
          </select>
        )}
      </div>

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
    </div>
  )
}

'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  GitBranch,
  Activity,
  XCircle,
  Bot,
  ChevronDown,
  AlertCircle,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { StatsCard } from '@/components/dashboard/stats-card'
import { RemediationFeed } from '@/components/dashboard/remediation-feed'
import { RunRow } from '@/components/workflows/run-row'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonCard, SkeletonRow } from '@/components/ui/skeleton'
import { useWebSocket } from '@/hooks/useWebSocket'
import {
  fetchCurrentUser,
  fetchOrgs,
  fetchWorkflowsByOrg,
  fetchRemediations,
  fetchRecentRuns,
} from '@/lib/api'
import type { WebSocketEvent, Remediation } from '@/types'
import { useQueryClient } from '@tanstack/react-query'

export default function DashboardPage() {
  const queryClient = useQueryClient()
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false)

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: fetchCurrentUser,
  })

  const { data: orgs = [], isLoading: orgsLoading } = useQuery({
    queryKey: ['orgs'],
    queryFn: fetchOrgs,
  })

  useEffect(() => {
    if (orgs.length > 0 && !selectedOrg) {
      setSelectedOrg(orgs[0].login)
    }
  }, [orgs, selectedOrg])

  const currentOrg = selectedOrg || orgs[0]?.login || ''

  const { data: workflows = [], isLoading: workflowsLoading } = useQuery({
    queryKey: ['workflows', currentOrg],
    queryFn: () => fetchWorkflowsByOrg(currentOrg),
    enabled: Boolean(currentOrg),
  })

  const { data: recentRuns = [], isLoading: runsLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: () => fetchRecentRuns(10),
  })

  const { data: remediations = [], isLoading: remediationsLoading } = useQuery({
    queryKey: ['remediations'],
    queryFn: fetchRemediations,
  })

  const handleWsMessage = useCallback(
    (event: WebSocketEvent) => {
      if (event.type === 'run_update') {
        queryClient.invalidateQueries({ queryKey: ['workflows'] })
        queryClient.invalidateQueries({ queryKey: ['runs'] })
      }
      if (event.type === 'remediation_created' || event.type === 'remediation_updated') {
        queryClient.invalidateQueries({ queryKey: ['remediations'] })
      }
    },
    [queryClient]
  )

  useWebSocket({ onMessage: handleWsMessage })

  const totalWorkflows = workflows.length
  const activeRuns = recentRuns.filter((r) => r.status === 'in_progress').length
  const failedToday = remediations.filter((r: Remediation) => {
    const runDate = new Date(r.created_at)
    const now = new Date()
    return (
      runDate.getUTCFullYear() === now.getUTCFullYear() &&
      runDate.getUTCMonth() === now.getUTCMonth() &&
      runDate.getUTCDate() === now.getUTCDate()
    )
  }).length
  const aiFixesRaised = remediations.filter(
    (r: Remediation) => r.status === 'pr_raised' && r.pr_url
  ).length

  const recentRemediations = remediations.slice(0, 3)

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">
            {greeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Here&apos;s what&apos;s happening across your pipelines.
          </p>
        </div>

        {/* Org selector */}
        {orgs.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              aria-label="Select organization"
              aria-expanded={orgDropdownOpen}
              className="inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 text-sm font-medium px-3.5 py-2 rounded-md hover:border-zinc-300 transition-colors shadow-sm"
            >
              {currentOrg || 'Select org'}
              <ChevronDown size={14} className="text-zinc-400" />
            </button>
            {orgDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 py-1">
                {orgs.map((org) => (
                  <button
                    key={org.login}
                    onClick={() => {
                      setSelectedOrg(org.login)
                      setOrgDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    {org.name || org.login}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {workflowsLoading || orgsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </>
        ) : (
          <>
            <StatsCard title="Total Workflows" value={totalWorkflows} icon={GitBranch} />
            <StatsCard
              title="Active Runs"
              value={activeRuns}
              icon={Activity}
              iconClassName="bg-emerald-50"
            />
            <StatsCard
              title="Failed Today"
              value={failedToday}
              icon={XCircle}
              iconClassName="bg-rose-50"
            />
            <StatsCard
              title="AI Fixes Raised"
              value={aiFixesRaised}
              icon={Bot}
              iconClassName="bg-amber-50"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent runs table */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Workflow Runs</CardTitle>
                <a
                  href="/runs"
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                >
                  View all
                </a>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">
                        Workflow
                      </th>
                      <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">
                        Repo
                      </th>
                      <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">
                        Branch
                      </th>
                      <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">
                        SHA
                      </th>
                      <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">
                        Status
                      </th>
                      <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">
                        Duration
                      </th>
                      <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">
                        Started
                      </th>
                      <th className="py-3 px-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {runsLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i}>
                          <td colSpan={8}>
                            <SkeletonRow />
                          </td>
                        </tr>
                      ))
                    ) : recentRuns.length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertCircle size={20} className="text-zinc-300 mb-2" />
                            <p className="text-sm text-zinc-400">
                              No workflow runs yet. Connect an organization in
                              Settings — runs appear here automatically as your
                              pipelines execute.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      recentRuns.map((run) => (
                        <RunRow
                          key={run.id}
                          run={run}
                          showWorkflow={true}
                          showRepo={true}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent remediations */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Remediations</CardTitle>
                <a
                  href="/remediation"
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                >
                  View all
                </a>
              </div>
            </CardHeader>
            <CardContent>
              {remediationsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : (
                <RemediationFeed remediations={recentRemediations} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

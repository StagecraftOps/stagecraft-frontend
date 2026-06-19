'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { RunRow } from '@/components/workflows/run-row'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonRow } from '@/components/ui/skeleton'
import { fetchOrgs, fetchRuns, fetchWorkflowsByOrg } from '@/lib/api'

const PAGE_SIZE = 25

type StatusFilter = 'all' | 'queued' | 'in_progress' | 'completed'
type ConclusionFilter = 'all' | 'success' | 'failure' | 'cancelled'

export default function RunsPage() {
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [selectedRepo, setSelectedRepo] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [conclusionFilter, setConclusionFilter] = useState<ConclusionFilter>('all')
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false)
  const [page, setPage] = useState(0)

  const { data: orgs = [] } = useQuery({
    queryKey: ['orgs'],
    queryFn: fetchOrgs,
  })

  useEffect(() => {
    if (orgs.length > 0 && !selectedOrg) {
      setSelectedOrg(orgs[0].login)
    }
  }, [orgs, selectedOrg])

  const currentOrg = selectedOrg || orgs[0]?.login || ''
  const currentOrgObj = orgs.find((o) => o.login === currentOrg)
  const isSyncing = currentOrgObj?.sync_status === 'syncing' || currentOrgObj?.sync_status === 'pending'

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows', currentOrg],
    queryFn: () => fetchWorkflowsByOrg(currentOrg),
    enabled: Boolean(currentOrg),
  })

  const repoOptions = useMemo(() => {
    const names = new Set(workflows.map((wf) => wf.repo_name))
    return Array.from(names).sort()
  }, [workflows])

  useEffect(() => {
    setSelectedRepo('all')
    setPage(0)
  }, [currentOrg])

  const {
    data: runsPage,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['runs', currentOrg, selectedRepo, statusFilter, conclusionFilter, page],
    queryFn: () =>
      fetchRuns({
        org_login: currentOrg || undefined,
        repo_name: selectedRepo !== 'all' ? selectedRepo : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        conclusion: conclusionFilter !== 'all' ? conclusionFilter : undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
    enabled: Boolean(currentOrg),
  })

  const runs = runsPage?.runs ?? []
  const total = runsPage?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-800">Workflow Runs</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Every workflow run across all repos in your organization — replacing the
          per-repo Actions tab.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
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
              <div className="absolute left-0 top-full mt-1.5 w-48 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 py-1">
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

        {/* Repo filter */}
        <select
          value={selectedRepo}
          onChange={(e) => {
            setSelectedRepo(e.target.value)
            setPage(0)
          }}
          className="text-sm border border-zinc-200 rounded-md bg-white text-zinc-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="all">All repos</option>
          {repoOptions.map((repo) => (
            <option key={repo} value={repo}>
              {repo}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as StatusFilter)
            setPage(0)
          }}
          className="text-sm border border-zinc-200 rounded-md bg-white text-zinc-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="all">Any status</option>
          <option value="queued">Queued</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>

        {/* Conclusion filter */}
        <select
          value={conclusionFilter}
          onChange={(e) => {
            setConclusionFilter(e.target.value as ConclusionFilter)
            setPage(0)
          }}
          className="text-sm border border-zinc-200 rounded-md bg-white text-zinc-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="all">Any conclusion</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <span className="text-sm text-zinc-400 ml-auto">
          {total} run{total !== 1 ? 's' : ''}
        </span>
      </div>

      {isSyncing && (
        <div className="flex items-center gap-3 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <Loader2 size={16} className="animate-spin" />
          <p className="text-sm">
            Syncing historical runs for {currentOrg}… new runs will appear as
            they're found.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
          <AlertCircle size={16} />
          <p className="text-sm">Failed to load runs. Check your connection.</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Runs</CardTitle>
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
                {isLoading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8}>
                        <SkeletonRow />
                      </td>
                    </tr>
                  ))
                ) : runs.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <AlertCircle size={20} className="text-zinc-300 mb-2" />
                        <p className="text-sm text-zinc-400">
                          {isSyncing
                            ? 'Historical sync is still in progress.'
                            : 'No workflow runs match these filters.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  runs.map((run) => (
                    <RunRow key={run.id} run={run} showWorkflow showRepo />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-zinc-400">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Previous page"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              aria-label="Next page"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { WorkflowCard } from '@/components/workflows/workflow-card'
import { SkeletonCard } from '@/components/ui/skeleton'
import { fetchOrgs, fetchWorkflowsByOrg } from '@/lib/api'
import type { Workflow } from '@/types'

type StatusFilter = 'all' | 'active' | 'failed' | 'disabled'

const filterButtons: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Failed', value: 'failed' },
  { label: 'Disabled', value: 'disabled' },
]

export default function WorkflowsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedOrg, setSelectedOrg] = useState<string>('')

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

  const { data: workflows = [], isLoading, error } = useQuery({
    queryKey: ['workflows', currentOrg],
    queryFn: () => fetchWorkflowsByOrg(currentOrg),
    enabled: Boolean(currentOrg),
  })

  const filtered = useMemo(() => {
    let result = workflows as Workflow[]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (wf) =>
          wf.name.toLowerCase().includes(q) ||
          wf.repo_name.toLowerCase().includes(q) ||
          wf.path.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== 'all') {
      result = result.filter((wf) => {
        if (statusFilter === 'active') return wf.state === 'active'
        if (statusFilter === 'disabled')
          return (
            wf.state === 'disabled_manually' || wf.state === 'disabled_inactivity'
          )
        if (statusFilter === 'failed') return wf.state !== 'active'
        return true
      })
    }

    return result
  }, [workflows, search, statusFilter])

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-800">Workflows</h1>
        <p className="text-sm text-zinc-500 mt-1">
          All GitHub Actions workflows across your organization.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Search by name or repo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-md bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-md">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setStatusFilter(btn.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                statusFilter === btn.value
                  ? 'bg-white text-zinc-800 shadow-sm border border-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Org selector */}
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

        <span className="text-sm text-zinc-400 ml-auto">
          {filtered.length} workflow{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
          <AlertCircle size={16} />
          <p className="text-sm">Failed to load workflows. Check your connection.</p>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
            <Search size={24} className="text-zinc-400" />
          </div>
          <h3 className="text-base font-semibold text-zinc-700 mb-1">
            No workflows found
          </h3>
          <p className="text-sm text-zinc-400 max-w-xs">
            {search
              ? `No workflows match "${search}". Try a different search.`
              : 'No workflows found for this organization.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((wf) => (
            <WorkflowCard
              key={wf.id}
              workflow={wf}
              org={currentOrg}
            />
          ))}
        </div>
      )}
    </div>
  )
}

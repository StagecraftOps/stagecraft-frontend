'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { GitBranch, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { fetchOrgs, fetchWorkflowsByOrg } from '@/lib/api'

export default function DependencyGraphIndexPage() {
  const [selectedOrg, setSelectedOrg] = useState('')

  const { data: orgs = [] } = useQuery({ queryKey: ['orgs'], queryFn: fetchOrgs })

  useEffect(() => {
    if (orgs.length > 0 && !selectedOrg) {
      setSelectedOrg(orgs[0].login)
    }
  }, [orgs, selectedOrg])

  const currentOrg = selectedOrg || orgs[0]?.login || ''

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows', currentOrg],
    queryFn: () => fetchWorkflowsByOrg(currentOrg),
    enabled: Boolean(currentOrg),
  })

  const repos = useMemo(
    () => Array.from(new Set(workflows.map((wf) => wf.repo_name))).sort(),
    [workflows]
  )

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Dependency Graph</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Pick a repository to visualize its workflow/job dependency structure.
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

      {repos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
            <GitBranch size={24} className="text-zinc-400" />
          </div>
          <h3 className="text-base font-semibold text-zinc-700 mb-1">No repositories found</h3>
          <p className="text-sm text-zinc-400 max-w-xs">
            Connect a GitHub organization in Settings to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {repos.map((repo) => (
            <Link key={repo} href={`/dependency-graph/${currentOrg}/${repo}`}>
              <Card className="hover:border-amber-300 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between py-5">
                  <div className="flex items-center gap-3">
                    <GitBranch size={16} className="text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {repo}
                    </span>
                  </div>
                  <ArrowRight size={14} className="text-zinc-400" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

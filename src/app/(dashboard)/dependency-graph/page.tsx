'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { GitBranch, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { useOrg } from '@/lib/org-context'
import { fetchWorkflowsByOrg } from '@/lib/api'

export default function DependencyGraphIndexPage() {
  const { currentOrg } = useOrg()

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
      <PageHeader
        eyebrow="Pipelines"
        title="Dependency Graph"
        description="Pick a repository to visualize its workflow/job dependency structure."
      />

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

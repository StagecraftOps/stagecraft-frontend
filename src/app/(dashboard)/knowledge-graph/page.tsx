'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Network, RefreshCw, AlertCircle } from 'lucide-react'
import { DagViewer } from '@/components/dependency-graph/dag-viewer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { fetchOrgs, fetchKnowledgeGraph, buildKnowledgeGraph } from '@/lib/api'

export default function KnowledgeGraphPage() {
  const [selectedOrg, setSelectedOrg] = useState('')
  const queryClient = useQueryClient()

  const { data: orgs = [] } = useQuery({ queryKey: ['orgs'], queryFn: fetchOrgs })
  useEffect(() => {
    if (orgs.length > 0 && !selectedOrg) setSelectedOrg(orgs[0].login)
  }, [orgs, selectedOrg])
  const currentOrg = selectedOrg || orgs[0]?.login || ''

  const { data: graph, isLoading, error } = useQuery({
    queryKey: ['knowledge-graph', currentOrg],
    queryFn: () => fetchKnowledgeGraph(currentOrg),
    enabled: Boolean(currentOrg),
    retry: false,
  })

  const build = useMutation({
    mutationFn: () => buildKnowledgeGraph(currentOrg),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge-graph', currentOrg] }),
  })

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <Network size={20} />
            Knowledge Graph
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Governance rules, failures, and runtime metrics cross-linked to your pipeline structure.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {orgs.length > 1 && (
            <select
              value={currentOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="text-sm border border-zinc-200 rounded-md bg-white text-zinc-700 px-3 py-2"
            >
              {orgs.map((org) => <option key={org.login} value={org.login}>{org.name || org.login}</option>)}
            </select>
          )}
          <button
            onClick={() => build.mutate()}
            disabled={build.isPending || !currentOrg}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={build.isPending ? 'animate-spin' : ''} />
            {build.isPending ? 'Building…' : 'Rebuild'}
          </button>
        </div>
      </div>

      {error && !isLoading && (
        <Card className="mb-6">
          <CardContent className="flex items-center gap-3 py-6 text-zinc-500">
            <AlertCircle size={16} />
            <p className="text-sm">
              No knowledge graph built yet. Click &quot;Rebuild&quot; — it works best after you have at
              least one dependency graph, some remediations, and/or governance findings for this org.
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="h-[600px] w-full rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-sm text-zinc-400">
          Loading graph…
        </div>
      )}

      {graph && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardDescription>Nodes</CardDescription>
                <CardTitle className="text-xl">{graph.node_count}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Edges</CardDescription>
                <CardTitle className="text-xl">{graph.edge_count}</CardTitle>
              </CardHeader>
            </Card>
          </div>
          <DagViewer nodes={graph.nodes} edges={graph.edges} />
        </>
      )}
    </div>
  )
}

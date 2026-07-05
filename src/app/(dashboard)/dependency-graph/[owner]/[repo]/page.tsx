'use client'

import { useParams } from 'next/navigation'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { DagViewer } from '@/components/dependency-graph/dag-viewer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { useBuildDependencyGraph, useDependencyGraph } from '@/hooks/useDependencyGraph'

export default function DependencyGraphPage() {
  const params = useParams<{ owner: string; repo: string }>()
  const owner = params.owner
  const repo = params.repo

  const { data: graph, isLoading, error } = useDependencyGraph(owner, repo)
  const buildGraph = useBuildDependencyGraph(owner, repo)

  return (
    <div className="p-8">
      <PageHeader
        eyebrow="Pipelines"
        title="Dependency Graph"
        description={`${owner}/${repo} — workflow, job, and service dependency structure.`}
        actions={
          <button
            onClick={() => buildGraph.mutate('main')}
            disabled={buildGraph.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={buildGraph.isPending ? 'animate-spin' : ''} />
            {buildGraph.isPending ? 'Building…' : 'Rebuild graph'}
          </button>
        }
      />

      {error && !isLoading && (
        <Card className="mb-6">
          <CardContent className="flex items-center gap-3 py-6 text-zinc-500">
            <AlertCircle size={16} />
            <p className="text-sm">
              No dependency graph has been built for this repo yet. Click &quot;Rebuild graph&quot; to analyze it.
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
          <div className="grid grid-cols-3 gap-4 mb-6">
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
            <Card>
              <CardHeader>
                <CardDescription>Last built</CardDescription>
                <CardTitle className="text-xl">
                  {graph.built_at ? new Date(graph.built_at).toLocaleString() : '—'}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <DagViewer nodes={graph.nodes} edges={graph.edges} />

          <p className="text-xs text-zinc-400 mt-3">
            Dashed amber edges are heuristically detected (e.g. repository_dispatch calls); dashed red edges
            have ambiguous confidence (e.g. a runtime-gated composite action step) and may not reflect the
            exact runtime path.
          </p>
        </>
      )}
    </div>
  )
}

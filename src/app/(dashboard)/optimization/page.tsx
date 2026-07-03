'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Zap, RefreshCw, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  fetchOrgs,
  fetchWorkflowsByOrg,
  analyzeOptimization,
  fetchOptimizationRecommendations,
  acceptRecommendation,
  rejectRecommendation,
} from '@/lib/api'

function formatDuration(seconds: number): string {
  const sign = seconds < 0 ? '-' : ''
  const abs = Math.abs(seconds)
  if (abs < 60) return `${sign}${abs}s`
  return `${sign}${Math.floor(abs / 60)}m ${abs % 60}s`
}

export default function OptimizationPage() {
  const [selectedOrg, setSelectedOrg] = useState('')
  const [selectedRepo, setSelectedRepo] = useState('')
  const [selectedWorkflow, setSelectedWorkflow] = useState('')
  const queryClient = useQueryClient()

  const { data: orgs = [] } = useQuery({ queryKey: ['orgs'], queryFn: fetchOrgs })
  useEffect(() => {
    if (orgs.length > 0 && !selectedOrg) setSelectedOrg(orgs[0].login)
  }, [orgs, selectedOrg])
  const currentOrg = selectedOrg || orgs[0]?.login || ''

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows', currentOrg],
    queryFn: () => fetchWorkflowsByOrg(currentOrg),
    enabled: Boolean(currentOrg),
  })
  const repos = useMemo(() => Array.from(new Set(workflows.map((w) => w.repo_name))).sort(), [workflows])
  useEffect(() => {
    if (repos.length > 0 && !selectedRepo) setSelectedRepo(repos[0])
  }, [repos, selectedRepo])
  const currentRepo = selectedRepo || repos[0] || ''

  const repoWorkflows = useMemo(
    () => workflows.filter((w) => w.repo_name === currentRepo),
    [workflows, currentRepo]
  )
  useEffect(() => {
    if (repoWorkflows.length > 0 && !selectedWorkflow) setSelectedWorkflow(repoWorkflows[0].path)
  }, [repoWorkflows, selectedWorkflow])
  const currentWorkflow = selectedWorkflow || repoWorkflows[0]?.path || ''

  const { data: recommendations = [] } = useQuery({
    queryKey: ['optimization-recommendations', currentOrg, currentRepo],
    queryFn: () => fetchOptimizationRecommendations(currentOrg, currentRepo),
    enabled: Boolean(currentOrg) && Boolean(currentRepo),
  })

  const analyze = useMutation({
    mutationFn: () => analyzeOptimization(currentOrg, currentRepo, currentWorkflow),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['optimization-recommendations', currentOrg, currentRepo] }),
  })

  const accept = useMutation({
    mutationFn: (id: string) => acceptRecommendation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['optimization-recommendations', currentOrg, currentRepo] }),
  })

  const reject = useMutation({
    mutationFn: (id: string) => rejectRecommendation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['optimization-recommendations', currentOrg, currentRepo] }),
  })

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <Zap size={20} />
            Optimization
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Bottleneck analysis, parallelization opportunities, and simulated time savings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {repos.length > 1 && (
            <select
              value={currentRepo}
              onChange={(e) => { setSelectedRepo(e.target.value); setSelectedWorkflow('') }}
              className="text-sm border border-zinc-200 rounded-md bg-white text-zinc-700 px-3 py-2"
            >
              {repos.map((repo) => <option key={repo} value={repo}>{repo}</option>)}
            </select>
          )}
          {repoWorkflows.length > 1 && (
            <select
              value={currentWorkflow}
              onChange={(e) => setSelectedWorkflow(e.target.value)}
              className="text-sm border border-zinc-200 rounded-md bg-white text-zinc-700 px-3 py-2"
            >
              {repoWorkflows.map((w) => <option key={w.path} value={w.path}>{w.name}</option>)}
            </select>
          )}
          <button
            onClick={() => analyze.mutate()}
            disabled={analyze.isPending || !currentWorkflow}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={analyze.isPending ? 'animate-spin' : ''} />
            Analyze
          </button>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-zinc-400">
            No optimization recommendations yet. Analysis needs a completed dependency graph
            (Dependency Graph tab) and job timing data (a few completed runs) for this workflow first.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <Card key={rec.id}>
              <CardContent className="py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge status={rec.status === 'proposed' ? 'pending' : rec.status} label={rec.recommendation_type.replace('_', ' ')} />
                      <span className="text-xs text-zinc-400">confidence {rec.confidence_score}%</span>
                    </div>
                    <p className="text-sm text-zinc-700 dark:text-zinc-200">{rec.description}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600">
                      <Clock size={12} />
                      Estimated savings: {formatDuration(rec.estimated_time_savings_seconds)}
                    </div>
                  </div>
                  {rec.status === 'proposed' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => accept.mutate(rec.id)}
                        className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded border border-emerald-200 hover:bg-emerald-50"
                      >
                        <CheckCircle2 size={13} /> Accept
                      </button>
                      <button
                        onClick={() => reject.mutate(rec.id)}
                        className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-rose-600 px-2 py-1 rounded border border-zinc-200 hover:bg-rose-50"
                      >
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

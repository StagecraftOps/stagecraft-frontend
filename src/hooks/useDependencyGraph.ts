import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  buildDependencyGraph,
  fetchDependencyGraph,
  fetchDependencyGraphHistory,
} from '@/lib/api'
import type { Graph, GraphDetail } from '@/types'

export function useDependencyGraph(org: string, repo: string) {
  return useQuery<GraphDetail>({
    queryKey: ['dependency-graph', org, repo],
    queryFn: () => fetchDependencyGraph(org, repo),
    enabled: Boolean(org) && Boolean(repo),
    retry: false,
  })
}

export function useDependencyGraphHistory(org: string, repo: string) {
  return useQuery<Graph[]>({
    queryKey: ['dependency-graph-history', org, repo],
    queryFn: () => fetchDependencyGraphHistory(org, repo),
    enabled: Boolean(org) && Boolean(repo),
  })
}

export function useBuildDependencyGraph(org: string, repo: string) {
  const queryClient = useQueryClient()
  return useMutation<Graph, unknown, string>({
    mutationFn: (ref: string) => buildDependencyGraph(org, repo, ref),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependency-graph-history', org, repo] })
    },
  })
}

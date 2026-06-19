import { useQuery } from '@tanstack/react-query'
import { fetchWorkflowsByOrg, fetchWorkflowsByRepo, fetchWorkflowRuns } from '@/lib/api'
import type { Workflow, WorkflowRun } from '@/types'

export function useWorkflows(org: string) {
  return useQuery<Workflow[]>({
    queryKey: ['workflows', org],
    queryFn: () => fetchWorkflowsByOrg(org),
    enabled: Boolean(org),
    staleTime: 30_000,
  })
}

export function useRepoWorkflows(org: string, repo: string) {
  return useQuery<Workflow[]>({
    queryKey: ['workflows', org, repo],
    queryFn: () => fetchWorkflowsByRepo(org, repo),
    enabled: Boolean(org) && Boolean(repo),
    staleTime: 30_000,
  })
}

export function useWorkflowRuns(org: string, repo: string, workflowId: number) {
  return useQuery<WorkflowRun[]>({
    queryKey: ['workflow-runs', org, repo, workflowId],
    queryFn: () => fetchWorkflowRuns(org, repo, workflowId),
    enabled: Boolean(org) && Boolean(repo) && Boolean(workflowId),
    staleTime: 15_000,
    refetchInterval: 30_000,
  })
}

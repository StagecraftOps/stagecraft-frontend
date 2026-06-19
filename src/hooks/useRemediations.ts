import { useQuery } from '@tanstack/react-query'
import { fetchRemediations, fetchRemediation } from '@/lib/api'
import type { Remediation } from '@/types'

export function useRemediations() {
  return useQuery<Remediation[]>({
    queryKey: ['remediations'],
    queryFn: fetchRemediations,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function useRemediation(id: string) {
  return useQuery<Remediation>({
    queryKey: ['remediation', id],
    queryFn: () => fetchRemediation(id),
    enabled: Boolean(id),
    staleTime: 60_000,
  })
}

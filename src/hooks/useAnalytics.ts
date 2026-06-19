import { useQuery } from '@tanstack/react-query'
import { fetchAnalytics } from '@/lib/api'
import type { AnalyticsData } from '@/types'

export function useAnalytics() {
  return useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  })
}

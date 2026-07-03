'use client'

import { useQuery } from '@tanstack/react-query'
import { GitPullRequest, ExternalLink, AlertCircle } from 'lucide-react'
import { fetchPRReviews } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { SkeletonRow } from '@/components/ui/skeleton'
import { formatRelativeTime, truncate } from '@/lib/utils'

function riskColor(score: number | null): string {
  if (score === null) return 'text-zinc-400'
  if (score >= 8) return 'text-rose-600'
  if (score >= 4) return 'text-amber-600'
  return 'text-emerald-600'
}

export default function PRReviewsPage() {
  const { data: reviews, isLoading, error } = useQuery({
    queryKey: ['pr-reviews'],
    queryFn: fetchPRReviews,
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Peer Review</h1>
        <p className="text-sm text-zinc-500 mt-1">
          AI-reviewed pull requests touching CI/CD workflows, powered by AWS Bedrock.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
          <AlertCircle size={16} />
          <p className="text-sm">Failed to load PR reviews.</p>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-800">
              <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">Repository</th>
              <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">PR</th>
              <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">Summary</th>
              <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">Risk</th>
              <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">Status</th>
              <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {isLoading &&
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={6}><SkeletonRow /></td></tr>
              ))}

            {!isLoading && (!reviews || reviews.length === 0) && (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                      <GitPullRequest size={28} className="text-amber-500" />
                    </div>
                    <h3 className="text-base font-semibold text-zinc-700 mb-1">No PR reviews yet</h3>
                    <p className="text-sm text-zinc-400 max-w-xs">
                      When a pull request touching CI/CD workflows is opened or updated, the
                      Peer Review Agent analyzes it and results appear here.
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              reviews?.map((review) => (
                <tr key={review.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <td className="py-3.5 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {review.repo_name}
                  </td>
                  <td className="py-3.5 px-4">
                    <a
                      href={review.pr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium"
                    >
                      #{review.pr_number}
                      <ExternalLink size={11} />
                    </a>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-zinc-600 dark:text-zinc-300">
                    {review.review_summary ? truncate(review.review_summary, 80) : (
                      <span className="text-zinc-400 italic">Analyzing…</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-sm font-bold tabular-nums ${riskColor(review.risk_score)}`}>
                      {review.risk_score ?? '—'}/10
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge status={review.status} />
                  </td>
                  <td className="py-3.5 px-4 text-xs text-zinc-400">
                    {formatRelativeTime(review.created_at)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

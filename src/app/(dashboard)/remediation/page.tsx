'use client'

import Link from 'next/link'
import { Bot, ExternalLink, AlertCircle } from 'lucide-react'
import { useRemediations } from '@/hooks/useRemediations'
import { Badge } from '@/components/ui/badge'
import { SkeletonRow } from '@/components/ui/skeleton'
import { truncate, formatRelativeTime } from '@/lib/utils'

export default function RemediationPage() {
  const { data: remediations, isLoading, error } = useRemediations()

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-800">Remediations</h1>
        <p className="text-sm text-zinc-500 mt-1">
          AI-generated fixes for failing pipelines, powered by AWS Bedrock.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
          <AlertCircle size={16} />
          <p className="text-sm">Failed to load remediations. Please try again.</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">
                Repository
              </th>
              <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">
                Workflow
              </th>
              <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">
                Root Cause
              </th>
              <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">
                Status
              </th>
              <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">
                PR
              </th>
              <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {isLoading && (
              <>
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6}>
                      <SkeletonRow />
                    </td>
                  </tr>
                ))}
              </>
            )}

            {!isLoading && (!remediations || remediations.length === 0) && (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                      <Bot size={28} className="text-amber-500" />
                    </div>
                    <h3 className="text-base font-semibold text-zinc-700 mb-1">
                      No remediations yet
                    </h3>
                    <p className="text-sm text-zinc-400 max-w-xs">
                      When a pipeline fails, AI reads the logs and produces a
                      suggested fix. Analyses appear here for your review.
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              remediations?.map((rem) => (
                <tr
                  key={rem.id}
                  className="hover:bg-zinc-50 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <span className="text-sm font-medium text-zinc-700">
                      {rem.repo_name}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs font-mono text-zinc-500 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded">
                      {rem.workflow_file}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Link
                      href={`/remediation/${rem.id}`}
                      className="text-sm text-zinc-600 hover:text-amber-700 transition-colors"
                    >
                      {truncate(rem.root_cause, 80)}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge status={rem.status} />
                  </td>
                  <td className="py-3.5 px-4">
                    {rem.pr_url ? (
                      <a
                        href={rem.pr_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium"
                      >
                        #{rem.pr_number}
                        <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="text-sm text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-zinc-400">
                    {formatRelativeTime(rem.created_at)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

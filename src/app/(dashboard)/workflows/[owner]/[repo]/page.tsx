'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, GitBranch, AlertCircle, ExternalLink } from 'lucide-react'
import { useRepoWorkflows } from '@/hooks/useWorkflows'
import { Badge } from '@/components/ui/badge'
import { SkeletonCard } from '@/components/ui/skeleton'

export default function RepoWorkflowsPage() {
  const params = useParams()
  const owner = params.owner as string
  const repo = params.repo as string

  const { data: workflows = [], isLoading, error } = useRepoWorkflows(owner, repo)

  return (
    <div className="p-8">
      {/* Back */}
      <Link
        href="/workflows"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Workflows
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
          <span>{owner}</span>
          <span>/</span>
          <span className="font-semibold text-zinc-700">{repo}</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-800">Workflows</h1>
        <p className="text-sm text-zinc-500 mt-1">
          All GitHub Actions workflows in this repository.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
          <AlertCircle size={16} />
          <p className="text-sm">Failed to load workflows for this repository.</p>
        </div>
      )}

      {/* Workflow list */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
            <GitBranch size={24} className="text-zinc-400" />
          </div>
          <h3 className="text-base font-semibold text-zinc-700 mb-1">
            No workflows
          </h3>
          <p className="text-sm text-zinc-400">
            This repository has no GitHub Actions workflows.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">
                  Name
                </th>
                <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">
                  File
                </th>
                <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">
                  State
                </th>
                <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider py-3 px-4">
                  Run History
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {workflows.map((wf) => (
                <tr key={wf.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="text-sm font-medium text-zinc-800">
                      {wf.name}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs font-mono text-zinc-500 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded">
                      {wf.path}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge status={wf.state} />
                  </td>
                  <td className="py-3.5 px-4">
                    <a
                      href={`https://github.com/${owner}/${repo}/actions/workflows/${wf.path.split('/').pop()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
                    >
                      View on GitHub
                      <ExternalLink size={12} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

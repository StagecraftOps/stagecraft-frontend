'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { AxiosError } from 'axios'
import {
  ArrowLeft,
  ExternalLink,
  Bot,
  AlertCircle,
  CheckCircle2,
  Clock,
  GitPullRequest,
  Copy,
  Check,
  Loader2,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchRemediation, raisePr } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatRelativeTime } from '@/lib/utils'

function TimelineStep({
  icon: Icon,
  label,
  description,
  completed,
  active,
}: {
  icon: React.ElementType
  label: string
  description?: string
  completed: boolean
  active: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          completed
            ? 'bg-emerald-100 text-emerald-600'
            : active
            ? 'bg-amber-100 text-amber-600'
            : 'bg-zinc-100 text-zinc-400'
        }`}
      >
        {active ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
      </div>
      <div>
        <p
          className={`text-sm font-medium ${
            completed ? 'text-zinc-800' : active ? 'text-amber-700' : 'text-zinc-400'
          }`}
        >
          {label}
        </p>
        {description && (
          <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  )
}

function YamlBlock({ yaml, filename }: { yaml: string; filename: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(yaml)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
    }
  }

  return (
    <div className="bg-zinc-900 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-700">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-zinc-600" />
            <span className="w-3 h-3 rounded-full bg-zinc-600" />
            <span className="w-3 h-3 rounded-full bg-zinc-600" />
          </div>
          <span className="text-xs text-zinc-400 font-mono">{filename}</span>
        </div>
        <button
          onClick={handleCopy}
          aria-label="Copy YAML"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1 rounded"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-5 text-xs text-zinc-300 font-mono leading-relaxed overflow-x-auto max-h-[480px]">
        <code>{yaml}</code>
      </pre>
    </div>
  )
}

export default function RemediationDetailPage() {
  const params = useParams()
  const id = params.id as string
  const queryClient = useQueryClient()

  const { data: remediation, isLoading, error } = useQuery({
    queryKey: ['remediation', id],
    queryFn: () => fetchRemediation(id),
    refetchInterval: (query) =>
      query.state.data?.status === 'analyzing' || query.state.data?.status === 'pending'
        ? 3000
        : false,
  })

  const raisePrMutation = useMutation({
    mutationFn: () => raisePr(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(['remediation', id], updated)
      queryClient.invalidateQueries({ queryKey: ['remediations'] })
    },
  })

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !remediation) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-4">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">Failed to load remediation details.</p>
        </div>
      </div>
    )
  }

  const isPending = remediation.status === 'pending'
  const isAnalyzing = remediation.status === 'analyzing'
  const isAnalyzed = remediation.status === 'analyzed'
  const isPrRaised = remediation.status === 'pr_raised'
  const isFailed = remediation.status === 'failed'
  const hasResult = isAnalyzed || isPrRaised
  const hasSuggestedYaml = Boolean(remediation.suggested_yaml)
  const canRaisePr = isAnalyzed && hasSuggestedYaml
  const raisePrErrorMessage =
    (raisePrMutation.error as AxiosError<{ detail?: string }> | null)?.response?.data?.detail
    ?? 'Failed to create PR on GitHub.'

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link
        href="/remediation"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Remediations
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Bot size={20} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-zinc-800">AI Analysis</h1>
              <Badge status={remediation.status} />
            </div>
            <div className="flex items-center gap-4 mt-1 flex-wrap">
              <span className="text-sm text-zinc-500">
                <span className="font-medium text-zinc-700">{remediation.repo_name}</span>
                {' '}· {remediation.workflow_file}
              </span>
              <span className="text-xs text-zinc-400">
                {formatRelativeTime(remediation.created_at)}
              </span>
            </div>
          </div>

          {/* Actions: PR raised or Raise PR button */}
          {isPrRaised && remediation.pr_url && (
            <a
              href={remediation.pr_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
            >
              <GitPullRequest size={14} />
              View PR #{remediation.pr_number}
              <ExternalLink size={12} />
            </a>
          )}
          {canRaisePr && (
            <Button
              variant="primary"
              onClick={() => raisePrMutation.mutate()}
              disabled={raisePrMutation.isPending}
            >
              {raisePrMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating PR…
                </>
              ) : (
                <>
                  <GitPullRequest size={14} />
                  Raise PR
                </>
              )}
            </Button>
          )}
        </div>

        {raisePrMutation.isError && (
          <div className="flex items-center gap-2 mt-4 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
            <AlertCircle size={14} />
            <p className="text-sm">{raisePrErrorMessage}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Root cause */}
          {remediation.root_cause && (
            <Card>
              <CardHeader>
                <CardTitle>Root Cause</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-lg">
                  <AlertCircle size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-800 leading-relaxed">
                    {remediation.root_cause}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggested YAML */}
          {hasResult && remediation.suggested_yaml && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Suggested Fix</CardTitle>
                  {isAnalyzed && (
                    <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-1 rounded">
                      Review before raising PR
                    </span>
                  )}
                  {isPrRaised && (
                    <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                      PR raised
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <YamlBlock
                  yaml={remediation.suggested_yaml}
                  filename={remediation.workflow_file}
                />
              </CardContent>
            </Card>
          )}

          {isAnalyzed && !hasSuggestedYaml && (
            <Card>
              <CardContent>
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                  <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 mb-1">
                      No YAML suggestion available
                    </p>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      AI identified the root cause, but it did not produce a valid workflow YAML fix for this remediation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analyzing placeholder */}
          {(isPending || isAnalyzing) && (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                    <Bot size={22} className="text-amber-500 animate-pulse" />
                  </div>
                  <p className="text-sm font-medium text-zinc-700 mb-1">
                    Analyzing with AWS Bedrock…
                  </p>
                  <p className="text-xs text-zinc-400">
                    Amazon Nova is reading the failure logs and generating a suggested fix.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {isFailed && (
            <Card>
              <CardContent>
                <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-lg">
                  <AlertCircle size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-rose-800 mb-1">Analysis failed</p>
                    {remediation.error_message && (
                      <p className="text-xs text-rose-700 font-mono">
                        {remediation.error_message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TimelineStep
                  icon={AlertCircle}
                  label="Failure detected"
                  description={formatDate(remediation.created_at)}
                  completed={true}
                  active={false}
                />
                <div className="w-px h-4 bg-zinc-200 ml-3.5" />
                <TimelineStep
                  icon={Bot}
                  label="Bedrock analysis"
                  description={!isPending ? formatDate(remediation.created_at) : undefined}
                  completed={hasResult || isFailed}
                  active={isAnalyzing}
                />
                <div className="w-px h-4 bg-zinc-200 ml-3.5" />
                <TimelineStep
                  icon={CheckCircle2}
                  label="Suggested fix ready"
                  completed={hasResult}
                  active={false}
                />
                <div className="w-px h-4 bg-zinc-200 ml-3.5" />
                <TimelineStep
                  icon={GitPullRequest}
                  label="PR raised"
                  description={remediation.pr_url ? `#${remediation.pr_number}` : undefined}
                  completed={isPrRaised}
                  active={false}
                />
              </div>
            </CardContent>
          </Card>

          {/* Meta */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-zinc-400 uppercase tracking-wider mb-0.5">
                    Organization
                  </dt>
                  <dd className="text-sm text-zinc-700 font-medium">{remediation.org_login}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-400 uppercase tracking-wider mb-0.5">
                    Repository
                  </dt>
                  <dd className="text-sm text-zinc-700 font-medium">{remediation.repo_name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-400 uppercase tracking-wider mb-0.5">
                    Workflow File
                  </dt>
                  <dd className="text-xs text-zinc-600 font-mono bg-zinc-50 px-2 py-1 rounded">
                    {remediation.workflow_file}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-400 uppercase tracking-wider mb-0.5">
                    <Clock size={11} className="inline mr-1" />
                    Created
                  </dt>
                  <dd className="text-sm text-zinc-700">{formatDate(remediation.created_at)}</dd>
                </div>
                {isPrRaised && remediation.pr_number && (
                  <div>
                    <dt className="text-xs text-zinc-400 uppercase tracking-wider mb-0.5">
                      Pull Request
                    </dt>
                    <dd>
                      <a
                        href={remediation.pr_url ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium"
                      >
                        <GitPullRequest size={13} />
                        #{remediation.pr_number}
                        <ExternalLink size={11} />
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

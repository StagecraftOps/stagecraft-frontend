'use client'

import { useState } from 'react'
import { AlertCircle, Bot, CheckCircle2, Clock, FlaskConical, GitPullRequest, Loader2, Plus, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { API_URL } from '@/lib/config'
import api from '@/lib/api'

interface K8sAnalysis {
  id: string
  cluster_name: string
  namespace: string
  pod_name: string
  status: 'analyzing' | 'analyzed' | 'failed' | 'no_fix_needed'
  root_cause: string | null
  suggested_fix: string | null
  fix_type: string | null
  source_repo: string | null
  pr_url: string | null
  created_at: string
}

interface LogSubmitForm {
  cluster_name: string
  namespace: string
  pod_name: string
  container_name: string
  log_lines: string
}

const EMPTY_FORM: LogSubmitForm = {
  cluster_name: '',
  namespace: 'agora',
  pod_name: '',
  container_name: '',
  log_lines: '',
}

async function fetchAnalyses(): Promise<K8sAnalysis[]> {
  const { data } = await api.get<K8sAnalysis[]>('/api/v1/k8s-remediation/')
  return data
}

async function submitLogs(form: LogSubmitForm): Promise<{ analysis_id: string }> {
  const { data } = await api.post<{ analysis_id: string }>('/api/v1/k8s-remediation/analyze', {
    cluster_name: form.cluster_name,
    namespace: form.namespace,
    pod_name: form.pod_name,
    container_name: form.container_name,
    log_lines: form.log_lines.split('\n').filter(Boolean),
  })
  return data
}

function AnalysisCard({ analysis }: { analysis: K8sAnalysis }) {
  const isAnalyzing = analysis.status === 'analyzing'
  const isAnalyzed = analysis.status === 'analyzed'
  const isFailed = analysis.status === 'failed'

  return (
    <Card className={isAnalyzing ? 'border-amber-200 bg-amber-50/30' : ''}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isAnalyzing ? 'bg-amber-100' : isAnalyzed ? 'bg-emerald-100' : 'bg-rose-100'
          }`}>
            {isAnalyzing ? (
              <Loader2 size={16} className="text-amber-600 animate-spin" />
            ) : isAnalyzed ? (
              <CheckCircle2 size={16} className="text-emerald-600" />
            ) : (
              <AlertCircle size={16} className="text-rose-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-medium text-zinc-800 font-mono">
                {analysis.namespace}/{analysis.pod_name}
              </span>
              <Badge status={analysis.status} />
              <span className="text-xs text-zinc-400">{analysis.cluster_name}</span>
            </div>
            {analysis.root_cause && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded px-2 py-1.5 mt-2 leading-relaxed">
                {analysis.root_cause}
              </p>
            )}
            {analysis.suggested_fix && (
              <details className="mt-2">
                <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-700">
                  Suggested fix ({analysis.fix_type || 'unknown type'})
                </summary>
                <pre className="mt-2 text-xs text-zinc-300 bg-zinc-900 rounded p-3 overflow-x-auto max-h-40 font-mono">
                  {analysis.suggested_fix}
                </pre>
              </details>
            )}
            {analysis.pr_url && (
              <a
                href={analysis.pr_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                <GitPullRequest size={12} />
                View PR
              </a>
            )}
          </div>
          <span className="text-xs text-zinc-400 flex-shrink-0">
            <Clock size={11} className="inline mr-0.5" />
            {new Date(analysis.created_at).toLocaleTimeString()}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function K8sRemediationPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<LogSubmitForm>(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)

  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ['k8s-analyses'],
    queryFn: fetchAnalyses,
    refetchInterval: (q) =>
      q.state.data?.some((a) => a.status === 'analyzing') ? 3000 : 30000,
  })

  const submit = useMutation({
    mutationFn: submitLogs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['k8s-analyses'] })
      setForm(EMPTY_FORM)
      setShowForm(false)
    },
  })

  const analyzing = analyses.filter((a) => a.status === 'analyzing').length

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-zinc-800">K8s Runtime Remediation</h1>
          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
            <FlaskConical size={11} />
            Beta
          </span>
        </div>
        <p className="text-sm text-zinc-500">
          Paste Kubernetes pod logs to get AI root cause analysis and suggested fixes.
          Unlike CI workflow remediation, this targets runtime application errors.
        </p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {analyzing > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
              <Loader2 size={13} className="animate-spin" />
              {analyzing} analysis{analyzing > 1 ? 'es' : ''} running
            </div>
          )}
        </div>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={15} />
          Analyze logs
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 border-amber-200">
          <CardHeader>
            <CardTitle>Submit Pod Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Cluster</label>
                <input
                  type="text"
                  value={form.cluster_name}
                  onChange={(e) => setForm({ ...form, cluster_name: e.target.value })}
                  placeholder="agora-dev"
                  className="w-full text-sm border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Namespace</label>
                <input
                  type="text"
                  value={form.namespace}
                  onChange={(e) => setForm({ ...form, namespace: e.target.value })}
                  placeholder="agora"
                  className="w-full text-sm border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Pod name</label>
                <input
                  type="text"
                  value={form.pod_name}
                  onChange={(e) => setForm({ ...form, pod_name: e.target.value })}
                  placeholder="agora-api-5d7c9f-xk2pl"
                  className="w-full text-sm border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Container</label>
                <input
                  type="text"
                  value={form.container_name}
                  onChange={(e) => setForm({ ...form, container_name: e.target.value })}
                  placeholder="agora-api"
                  className="w-full text-sm border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Log lines <span className="text-zinc-400">(max 500)</span>
              </label>
              <textarea
                value={form.log_lines}
                onChange={(e) => setForm({ ...form, log_lines: e.target.value })}
                placeholder="Paste pod logs here..."
                rows={10}
                className="w-full text-xs font-mono border border-zinc-200 rounded-md px-3 py-2 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>
            {submit.isError && (
              <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-sm">
                <AlertCircle size={14} />
                {(submit.error as Error)?.message || 'Failed to submit logs'}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => submit.mutate(form)}
                disabled={!form.cluster_name || !form.pod_name || !form.log_lines || submit.isPending}
              >
                {submit.isPending ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : <><Bot size={14} /> Analyze</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-zinc-400 text-sm">Loading…</div>
        ) : analyses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-4">
              <FlaskConical size={26} className="text-amber-500" />
            </div>
            <h3 className="text-base font-semibold text-zinc-700 mb-1">No analyses yet</h3>
            <p className="text-sm text-zinc-400 max-w-xs">
              Submit Kubernetes pod logs using the button above. The AI will identify the root cause
              and suggest a fix — either a config change or application code patch.
            </p>
          </div>
        ) : (
          analyses.map((a) => <AnalysisCard key={a.id} analysis={a} />)
        )}
      </div>
    </div>
  )
}

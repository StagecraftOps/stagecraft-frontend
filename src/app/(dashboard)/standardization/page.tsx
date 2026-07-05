'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Layers, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  fetchOrgs,
  fetchWorkflowsByOrg,
  fetchTemplates,
  fetchTemplateDiffs,
  fetchPatternClusters,
  analyzeStandardization,
  createTemplate,
} from '@/lib/api'

function scoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-rose-600'
}

export default function StandardizationPage() {
  const [selectedOrg, setSelectedOrg] = useState('')
  const [selectedRepo, setSelectedRepo] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [tplName, setTplName] = useState('')
  const [tplDesc, setTplDesc] = useState('')
  const [tplYaml, setTplYaml] = useState('')
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

  const { data: templates = [] } = useQuery({
    queryKey: ['templates', currentOrg],
    queryFn: () => fetchTemplates(currentOrg),
    enabled: Boolean(currentOrg),
  })

  const { data: diffs = [] } = useQuery({
    queryKey: ['template-diffs', currentOrg, currentRepo],
    queryFn: () => fetchTemplateDiffs(currentOrg, currentRepo),
    enabled: Boolean(currentOrg) && Boolean(currentRepo),
  })

  const { data: patterns = [] } = useQuery({
    queryKey: ['pattern-clusters', currentOrg],
    queryFn: () => fetchPatternClusters(currentOrg),
    enabled: Boolean(currentOrg),
  })

  const analyze = useMutation({
    mutationFn: () => analyzeStandardization(currentOrg, currentRepo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-diffs', currentOrg, currentRepo] })
      queryClient.invalidateQueries({ queryKey: ['pattern-clusters', currentOrg] })
    },
  })

  const register = useMutation({
    mutationFn: () =>
      createTemplate(currentOrg, {
        name: tplName.trim(),
        description: tplDesc.trim() || undefined,
        template_yaml: tplYaml,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', currentOrg] })
      setShowRegister(false)
      setTplName('')
      setTplDesc('')
      setTplYaml('')
    },
  })

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <Layers size={20} />
            Standardization
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Template adoption gaps and reusable-component opportunities across your pipelines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {repos.length > 1 && (
            <select
              value={currentRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="text-sm border border-zinc-200 rounded-md bg-white text-zinc-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {repos.map((repo) => (
                <option key={repo} value={repo}>{repo}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowRegister((v) => !v)}
            disabled={!currentOrg}
            className="px-4 py-2 text-sm font-medium rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            Register template
          </button>
          <button
            onClick={() => analyze.mutate()}
            disabled={analyze.isPending || !currentRepo || templates.length === 0}
            title={templates.length === 0 ? 'Register a template first' : undefined}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={analyze.isPending ? 'animate-spin' : ''} />
            Analyze
          </button>
        </div>
      </div>

      {showRegister && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Register an approved template</CardTitle>
            <CardDescription>
              Paste the canonical workflow YAML your pipelines should follow. Adoption is scored against it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={tplName}
                onChange={(e) => setTplName(e.target.value)}
                placeholder="Template name (e.g. Standard CI)"
                className="text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <input
                value={tplDesc}
                onChange={(e) => setTplDesc(e.target.value)}
                placeholder="Description (optional)"
                className="text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <textarea
              value={tplYaml}
              onChange={(e) => setTplYaml(e.target.value)}
              placeholder={'name: Standard CI\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4'}
              rows={10}
              className="w-full font-mono text-xs border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {register.isError && (
              <p className="text-xs text-rose-600">Failed to register template. Check the YAML and try again.</p>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => register.mutate()}
                disabled={register.isPending || !tplName.trim() || !tplYaml.trim()}
                className="px-4 py-2 text-sm font-medium rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {register.isPending ? 'Saving…' : 'Save template'}
              </button>
              <button
                onClick={() => setShowRegister(false)}
                className="px-4 py-2 text-sm font-medium rounded-md text-zinc-500 hover:text-zinc-700"
              >
                Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {templates.length === 0 ? (
        <Card className="mb-6">
          <CardContent className="py-6 text-sm text-zinc-500">
            No approved templates registered for this org yet — template-adoption analysis (FR-3) needs at
            least one template to diff against. Click <strong>Register template</strong> above to add one.
            Standardization-opportunity discovery (FR-4, below) works without one.
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent className="py-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-zinc-500 mr-2">Approved templates:</span>
            {templates.map((t) => (
              <Badge key={t.id} status="analyzed" label={t.name} />
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Template Adoption — {currentRepo || '—'}</CardTitle>
            <CardDescription>Missing required components and version drift vs. approved templates.</CardDescription>
          </CardHeader>
          <CardContent>
            {diffs.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4 text-center">No diff results yet. Click Analyze.</p>
            ) : (
              <div className="space-y-3">
                {diffs.map((diff) => (
                  <div key={diff.id} className="border border-zinc-100 dark:border-zinc-800 rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                        {diff.workflow_file}
                      </span>
                      <span className={`text-sm font-bold tabular-nums ${scoreColor(diff.adoption_score)}`}>
                        {diff.adoption_score}%
                      </span>
                    </div>
                    {diff.diff_summary.missing_components.length === 0 &&
                    diff.diff_summary.version_drift.length === 0 ? (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Fully compliant
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {diff.diff_summary.missing_components.map((c) => (
                          <p key={c} className="text-xs text-rose-600 flex items-center gap-1">
                            <AlertTriangle size={11} /> Missing: {c}
                          </p>
                        ))}
                        {diff.diff_summary.version_drift.map((d) => (
                          <p key={d.component} className="text-xs text-amber-600">
                            Version drift: {d.component} ({d.workflow_version} vs. template {d.template_version})
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reusable Component Opportunities</CardTitle>
            <CardDescription>Patterns repeated across multiple workflows in this org.</CardDescription>
          </CardHeader>
          <CardContent>
            {patterns.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4 text-center">No repeated patterns found yet.</p>
            ) : (
              <div className="space-y-3">
                {patterns.map((pattern) => (
                  <div key={pattern.id} className="border border-zinc-100 dark:border-zinc-800 rounded-md p-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge status="analyzed" label="Reusable candidate" />
                      <span className="text-xs text-zinc-400">
                        {pattern.occurrence_count} occurrences
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 font-mono">
                      {pattern.pattern_signature.components.join(', ')}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1 truncate">
                      e.g. {pattern.example_workflow_files.slice(0, 3).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

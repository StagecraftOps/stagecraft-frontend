'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, Upload, FileText, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  fetchOrgs,
  fetchWorkflowsByOrg,
  fetchGovernanceDocuments,
  uploadGovernanceDocument,
  analyzeGovernance,
  fetchComplianceFindings,
} from '@/lib/api'
import type { GovernanceDocType } from '@/types'

const FRAMEWORKS = ['HIPAA', 'PCI', 'SOC2']

function statusIcon(status: string) {
  if (status === 'gap') return <AlertTriangle size={13} className="text-rose-500" />
  if (status === 'compliant') return <CheckCircle2 size={13} className="text-emerald-500" />
  return <span className="text-zinc-400 text-xs">N/A</span>
}

export default function GovernancePage() {
  const [selectedOrg, setSelectedOrg] = useState('')
  const [selectedRepo, setSelectedRepo] = useState('')
  const [docType, setDocType] = useState<GovernanceDocType>('governance_policy')
  const [title, setTitle] = useState('')
  const [framework, setFramework] = useState(FRAMEWORKS[0])
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

  const { data: documents = [] } = useQuery({
    queryKey: ['governance-documents', currentOrg],
    queryFn: () => fetchGovernanceDocuments(currentOrg),
    enabled: Boolean(currentOrg),
  })

  const { data: findings = [] } = useQuery({
    queryKey: ['compliance-findings', currentOrg, currentRepo],
    queryFn: () => fetchComplianceFindings(currentOrg, currentRepo),
    enabled: Boolean(currentOrg) && Boolean(currentRepo),
  })

  const upload = useMutation({
    mutationFn: (file: File) => uploadGovernanceDocument(currentOrg, docType, title || file.name, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-documents', currentOrg] })
      setTitle('')
    },
  })

  const analyzeFramework = useMutation({
    mutationFn: () => analyzeGovernance(currentOrg, currentRepo, { mode: 'framework', framework }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['compliance-findings', currentOrg, currentRepo] }),
  })

  const analyzeDocument = useMutation({
    mutationFn: (documentId: string) =>
      analyzeGovernance(currentOrg, currentRepo, { mode: 'document', document_id: documentId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['compliance-findings', currentOrg, currentRepo] }),
  })

  const gapCount = findings.filter((f) => f.status === 'gap').length
  const complianceScore = findings.length > 0 ? Math.round(100 * (findings.length - gapCount) / findings.length) : null

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <ShieldCheck size={20} />
            Governance & Compliance
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Framework checks and policy-document gap analysis for your pipelines.
          </p>
        </div>
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
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardDescription>Compliance Score — {currentRepo || '—'}</CardDescription>
            <CardTitle className="text-2xl">
              {complianceScore === null ? '—' : `${complianceScore}%`}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Framework Check</CardTitle>
            <CardDescription>Run a control-presence audit against a compliance framework.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                className="text-sm border border-zinc-200 rounded-md bg-white text-zinc-700 px-3 py-2 flex-1"
              >
                {FRAMEWORKS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <button
                onClick={() => analyzeFramework.mutate()}
                disabled={analyzeFramework.isPending || !currentRepo}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={14} className={analyzeFramework.isPending ? 'animate-spin' : ''} />
                Analyze
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>Governance policy or application-profile document.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as GovernanceDocType)}
                className="text-xs border border-zinc-200 rounded-md bg-white text-zinc-700 px-2 py-1.5"
              >
                <option value="governance_policy">Governance Policy</option>
                <option value="app_profile">Application Profile</option>
              </select>
              <input
                type="text"
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 text-xs border border-zinc-200 rounded-md px-2 py-1.5"
              />
            </div>
            <label className="flex items-center justify-center gap-2 text-xs font-medium text-zinc-600 border border-dashed border-zinc-300 rounded-md py-2 cursor-pointer hover:bg-zinc-50">
              <Upload size={12} />
              {upload.isPending ? 'Uploading…' : 'Choose file (.txt/.docx/.pdf)'}
              <input
                type="file"
                accept=".txt,.docx,.pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && upload.mutate(e.target.files[0])}
              />
            </label>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4 text-center">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between border border-zinc-100 dark:border-zinc-800 rounded-md p-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-zinc-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{doc.title}</p>
                        <p className="text-xs text-zinc-400">{doc.doc_type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => analyzeDocument.mutate(doc.id)}
                      disabled={analyzeDocument.isPending || !currentRepo}
                      className="text-xs font-medium text-amber-600 hover:text-amber-700 disabled:opacity-50 flex-shrink-0"
                    >
                      Analyze
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Findings — {currentRepo || '—'}</CardTitle>
          </CardHeader>
          <CardContent>
            {findings.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4 text-center">No findings yet. Run an analysis above.</p>
            ) : (
              <div className="space-y-2">
                {findings.map((finding) => (
                  <div key={finding.id} className="flex items-start gap-2 border border-zinc-100 dark:border-zinc-800 rounded-md p-3">
                    {statusIcon(finding.status)}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{finding.requirement_id}</p>
                      <p className="text-xs text-zinc-500">{finding.finding_detail}</p>
                      {finding.remediation_suggestion && (
                        <p className="text-xs text-amber-600 mt-1">{finding.remediation_suggestion}</p>
                      )}
                    </div>
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

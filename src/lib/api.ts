import axios from 'axios'
import type {
  User,
  Organization,
  Workflow,
  WorkflowRun,
  Remediation,
  AnalyticsData,
  Graph,
  GraphDetail,
  JobRunData,
  CriticalPathData,
  LongestJobEntry,
  LongestWorkflowEntry,
  RunnerBreakdownEntry,
  WorkflowTemplate,
  TemplateDiff,
  PatternCluster,
  PRReview,
  GovernanceDocument,
  GovernanceDocType,
  ComplianceFinding,
  OptimizationRecommendation,
  SimulationRun,
} from '@/types'
import { API_URL } from '@/lib/config'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await api.get<User>('/api/v1/auth/me')
  return data
}

export async function fetchOrgs(): Promise<Organization[]> {
  const { data } = await api.get<{ organizations: Organization[]; total: number }>(
    '/api/v1/orgs/'
  )
  return data.organizations
}

export function getOrgInstallUrl(): string {
  return `${API_URL}/api/v1/orgs/install`
}

export async function removeOrg(org_login: string): Promise<void> {
  await api.delete(`/api/v1/orgs/${org_login}`)
}

export async function fetchWorkflowsByOrg(org: string): Promise<Workflow[]> {
  const { data } = await api.get<{ workflows: Workflow[]; total: number }>(
    `/api/v1/workflows/${org}/workflows`
  )
  return data.workflows
}

export async function fetchWorkflowsByRepo(org: string, repo: string): Promise<Workflow[]> {
  const { data } = await api.get<{ workflows: Workflow[]; total: number }>(
    `/api/v1/workflows/${org}/${repo}/workflows`
  )
  return data.workflows
}

export async function fetchWorkflowRuns(
  org: string,
  repo: string,
  workflowId: number
): Promise<WorkflowRun[]> {
  const { data } = await api.get<{ runs: WorkflowRun[]; total: number }>(
    `/api/v1/workflows/${org}/${repo}/workflows/${workflowId}/runs`
  )
  return data.runs
}

export interface FetchRunsParams {
  limit?: number
  offset?: number
  org_login?: string
  repo_name?: string
  status?: string
  conclusion?: string
}

export interface RunsPage {
  runs: WorkflowRun[]
  total: number
}

export async function fetchRuns(params: FetchRunsParams = {}): Promise<RunsPage> {
  const { data } = await api.get<RunsPage>('/api/v1/runs/', { params })
  return data
}

export async function fetchRecentRuns(limit = 20): Promise<WorkflowRun[]> {
  const { runs } = await fetchRuns({ limit })
  return runs
}

export async function fetchRun(runId: string): Promise<WorkflowRun> {
  const { data } = await api.get<WorkflowRun>(`/api/v1/runs/${runId}`)
  return data
}

export async function fetchRunLogs(runId: string): Promise<string> {
  const { data } = await api.get<{ logs: string }>(`/api/v1/runs/${runId}/logs`)
  return data.logs
}

export async function fetchRemediations(): Promise<Remediation[]> {
  const { data } = await api.get<{ remediations: Remediation[]; total: number }>(
    '/api/v1/remediations/'
  )
  return data.remediations
}

export async function fetchRemediation(id: string): Promise<Remediation> {
  const { data } = await api.get<Remediation>(`/api/v1/remediations/${id}`)
  return data
}

export async function raisePr(remediationId: string): Promise<Remediation> {
  const { data } = await api.post<Remediation>(
    `/api/v1/remediations/${remediationId}/raise-pr`
  )
  return data
}

export async function markHelpful(remediationId: string): Promise<Remediation> {
  const { data } = await api.post<Remediation>(
    `/api/v1/remediations/${remediationId}/mark-helpful`
  )
  return data
}

export async function searchRemediations(q: string): Promise<Remediation[]> {
  const { data } = await api.get<Remediation[]>('/api/v1/remediations/search', { params: { q } })
  return data
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const { data } = await api.get<AnalyticsData>('/api/v1/analytics/')
  return data
}

// ── Feature 3: Natural Language Pipeline Chat ─────────────────────────────

export interface ChatResponse {
  answer: string
  sql?: string | null
  data?: Record<string, unknown>[] | null
  error?: string | null
}

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>('/api/v1/chat/', { message })
  return data
}

// ── Feature 4: Multi-Repo Correlation ────────────────────────────────────

export async function getSimilarRemediations(
  remediationId: string,
  limit = 5
): Promise<Remediation[]> {
  const { data } = await api.get<Remediation[]>(
    `/api/v1/remediations/${remediationId}/similar`,
    { params: { limit } }
  )
  return data
}

// ── Dependency graph (FR-1) ───────────────────────────────────────────────

export async function buildDependencyGraph(
  org: string,
  repo: string,
  ref = 'main'
): Promise<Graph> {
  const { data } = await api.post<Graph>(
    `/api/v1/orgs/${org}/repos/${repo}/dependency-graph/build`,
    { ref }
  )
  return data
}

export async function fetchDependencyGraph(org: string, repo: string): Promise<GraphDetail> {
  const { data } = await api.get<GraphDetail>(`/api/v1/orgs/${org}/repos/${repo}/dependency-graph`)
  return data
}

export async function fetchDependencyGraphHistory(org: string, repo: string): Promise<Graph[]> {
  const { data } = await api.get<{ graphs: Graph[]; total: number }>(
    `/api/v1/orgs/${org}/repos/${repo}/dependency-graph/history`
  )
  return data.graphs
}

export async function fetchKnowledgeGraph(org: string): Promise<GraphDetail> {
  const { data } = await api.get<GraphDetail>(`/api/v1/orgs/${org}/knowledge-graph`)
  return data
}

export async function buildKnowledgeGraph(org: string): Promise<void> {
  await api.post(`/api/v1/orgs/${org}/knowledge-graph/build`)
}

// ── Runtime monitoring (FR-2) ─────────────────────────────────────────────

export async function fetchRunJobs(runId: string): Promise<JobRunData[]> {
  const { data } = await api.get<{ jobs: JobRunData[] }>(`/api/v1/runs/${runId}/jobs`)
  return data.jobs
}

export async function fetchRunCriticalPath(runId: string): Promise<CriticalPathData | null> {
  try {
    const { data } = await api.get<CriticalPathData>(`/api/v1/runs/${runId}/critical-path`)
    return data
  } catch {
    return null
  }
}

export async function fetchLongestJobs(org: string, limit = 10): Promise<LongestJobEntry[]> {
  const { data } = await api.get<LongestJobEntry[]>(
    `/api/v1/orgs/${org}/performance/longest-jobs`,
    { params: { limit } }
  )
  return data
}

export async function fetchLongestWorkflows(org: string, limit = 10): Promise<LongestWorkflowEntry[]> {
  const { data } = await api.get<LongestWorkflowEntry[]>(
    `/api/v1/orgs/${org}/performance/longest-workflows`,
    { params: { limit } }
  )
  return data
}

export async function fetchRunnerBreakdown(org: string): Promise<RunnerBreakdownEntry[]> {
  const { data } = await api.get<RunnerBreakdownEntry[]>(
    `/api/v1/orgs/${org}/performance/runner-breakdown`
  )
  return data
}

// ── Standardization (FR-3/FR-4) ───────────────────────────────────────────

export async function fetchTemplates(org: string): Promise<WorkflowTemplate[]> {
  const { data } = await api.get<{ templates: WorkflowTemplate[] }>(`/api/v1/orgs/${org}/templates`)
  return data.templates
}

export async function createTemplate(
  org: string,
  body: { name: string; description?: string; template_yaml: string }
): Promise<WorkflowTemplate> {
  const { data } = await api.post<WorkflowTemplate>(`/api/v1/orgs/${org}/templates`, body)
  return data
}

export async function deactivateTemplate(org: string, templateId: string): Promise<void> {
  await api.delete(`/api/v1/orgs/${org}/templates/${templateId}`)
}

export async function analyzeStandardization(org: string, repo: string, ref = 'main'): Promise<void> {
  await api.post(`/api/v1/orgs/${org}/repos/${repo}/standardization/analyze`, { ref })
}

export async function fetchTemplateDiffs(org: string, repo: string): Promise<TemplateDiff[]> {
  const { data } = await api.get<{ diffs: TemplateDiff[] }>(
    `/api/v1/orgs/${org}/repos/${repo}/standardization/diffs`
  )
  return data.diffs
}

export async function fetchPatternClusters(org: string): Promise<PatternCluster[]> {
  const { data } = await api.get<{ patterns: PatternCluster[] }>(
    `/api/v1/orgs/${org}/standardization/patterns`
  )
  return data.patterns
}

// ── Peer Review Agent (FR-12a) ────────────────────────────────────────────

export async function fetchPRReviews(): Promise<PRReview[]> {
  const { data } = await api.get<{ reviews: PRReview[]; total: number }>('/api/v1/pr-reviews/')
  return data.reviews
}

export async function fetchPRReview(id: string): Promise<PRReview> {
  const { data } = await api.get<PRReview>(`/api/v1/pr-reviews/${id}`)
  return data
}

// ── Governance & compliance (FR-5/FR-6) ───────────────────────────────────

export async function fetchGovernanceDocuments(org: string): Promise<GovernanceDocument[]> {
  const { data } = await api.get<{ documents: GovernanceDocument[] }>(`/api/v1/orgs/${org}/governance/documents`)
  return data.documents
}

export async function uploadGovernanceDocument(
  org: string,
  docType: GovernanceDocType,
  title: string,
  file: File
): Promise<GovernanceDocument> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<GovernanceDocument>(
    `/api/v1/orgs/${org}/governance/documents`,
    formData,
    { params: { doc_type: docType, title }, headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

export async function analyzeGovernance(
  org: string,
  repo: string,
  body: { mode: 'framework' | 'document'; ref?: string; framework?: string; document_id?: string }
): Promise<void> {
  await api.post(`/api/v1/orgs/${org}/repos/${repo}/governance/analyze`, { ref: 'main', ...body })
}

export async function fetchComplianceFindings(org: string, repo: string): Promise<ComplianceFinding[]> {
  const { data } = await api.get<{ findings: ComplianceFinding[] }>(
    `/api/v1/orgs/${org}/repos/${repo}/governance/findings`
  )
  return data.findings
}

// ── Performance optimization (FR-7/FR-8/FR-9) ─────────────────────────────

export async function analyzeOptimization(org: string, repo: string, workflowFile: string, ref = 'main'): Promise<void> {
  await api.post(`/api/v1/orgs/${org}/repos/${repo}/optimization/analyze`, { workflow_file: workflowFile, ref })
}

export async function fetchOptimizationRecommendations(org: string, repo: string): Promise<OptimizationRecommendation[]> {
  const { data } = await api.get<{ recommendations: OptimizationRecommendation[] }>(
    `/api/v1/orgs/${org}/repos/${repo}/optimization/recommendations`
  )
  return data.recommendations
}

export async function fetchSimulation(recommendationId: string): Promise<SimulationRun> {
  const { data } = await api.get<SimulationRun>(`/api/v1/optimization/recommendations/${recommendationId}/simulation`)
  return data
}

export async function acceptRecommendation(recommendationId: string): Promise<OptimizationRecommendation> {
  const { data } = await api.post<OptimizationRecommendation>(
    `/api/v1/optimization/recommendations/${recommendationId}/accept`
  )
  return data
}

export async function rejectRecommendation(recommendationId: string): Promise<OptimizationRecommendation> {
  const { data } = await api.post<OptimizationRecommendation>(
    `/api/v1/optimization/recommendations/${recommendationId}/reject`
  )
  return data
}

export default api

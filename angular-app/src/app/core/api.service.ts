import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { API_URL } from './config'
import type {
  User,
  Organization,
  Workflow,
  WorkflowRun,
  Remediation,
  AnalyticsData,
  LongestJobEntry,
  LongestWorkflowEntry,
  RunnerBreakdownEntry,
  PRReview,
  RunsPage,
  FetchRunsParams,
  Graph,
  GraphDetail,
  JobRunData,
  CriticalPathData,
  WorkflowTemplate,
  TemplateDiff,
  PatternCluster,
  GovernanceDocument,
  GovernanceDocType,
  ComplianceFinding,
  OptimizationRecommendation,
  SimulationRun,
  AgentRun,
  AgentFleetSummary,
} from './types'

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  fetchCurrentUser(): Promise<User> {
    return firstValueFrom(this.http.get<User>(`${API_URL}/api/v1/auth/me`))
  }

  async fetchOrgs(): Promise<Organization[]> {
    const data = await firstValueFrom(
      this.http.get<{ organizations: Organization[]; total: number }>(`${API_URL}/api/v1/orgs/`),
    )
    return data.organizations
  }

  getOrgInstallUrl(): string {
    return `${API_URL}/api/v1/orgs/install`
  }

  removeOrg(login: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API_URL}/api/v1/orgs/${login}`))
  }

  async fetchWorkflowsByOrg(org: string): Promise<Workflow[]> {
    const data = await firstValueFrom(
      this.http.get<{ workflows: Workflow[]; total: number }>(`${API_URL}/api/v1/workflows/${org}/workflows`),
    )
    return data.workflows
  }

  async fetchWorkflowsByRepo(org: string, repo: string): Promise<Workflow[]> {
    const data = await firstValueFrom(
      this.http.get<{ workflows: Workflow[]; total: number }>(`${API_URL}/api/v1/workflows/${org}/${repo}/workflows`),
    )
    return data.workflows
  }

  async fetchWorkflowRuns(org: string, repo: string, workflowId: number): Promise<WorkflowRun[]> {
    const data = await firstValueFrom(
      this.http.get<{ runs: WorkflowRun[]; total: number }>(
        `${API_URL}/api/v1/workflows/${org}/${repo}/workflows/${workflowId}/runs`,
      ),
    )
    return data.runs
  }

  fetchRuns(params: FetchRunsParams = {}): Promise<RunsPage> {
    const query: Record<string, string> = {}
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) query[k] = String(v)
    }
    return firstValueFrom(this.http.get<RunsPage>(`${API_URL}/api/v1/runs/`, { params: query }))
  }

  async fetchRecentRuns(limit = 20): Promise<WorkflowRun[]> {
    const page = await this.fetchRuns({ limit })
    return page.runs
  }

  fetchRun(runId: string): Promise<WorkflowRun> {
    return firstValueFrom(this.http.get<WorkflowRun>(`${API_URL}/api/v1/runs/${runId}`))
  }

  async fetchRunLogs(runId: string): Promise<string> {
    const data = await firstValueFrom(this.http.get<{ logs: string }>(`${API_URL}/api/v1/runs/${runId}/logs`))
    return data.logs
  }

  async fetchRemediations(): Promise<Remediation[]> {
    const data = await firstValueFrom(
      this.http.get<{ remediations: Remediation[]; total: number }>(`${API_URL}/api/v1/remediations/`),
    )
    return data.remediations
  }

  fetchRemediation(id: string): Promise<Remediation> {
    return firstValueFrom(this.http.get<Remediation>(`${API_URL}/api/v1/remediations/${id}`))
  }

  raisePr(remediationId: string): Promise<Remediation> {
    return firstValueFrom(this.http.post<Remediation>(`${API_URL}/api/v1/remediations/${remediationId}/raise-pr`, {}))
  }

  fetchAnalytics(): Promise<AnalyticsData> {
    return firstValueFrom(this.http.get<AnalyticsData>(`${API_URL}/api/v1/analytics/`))
  }

  sendChatMessage(message: string): Promise<{ answer: string; sql?: string | null; data?: Record<string, unknown>[] | null; error?: string | null }> {
    return firstValueFrom(
      this.http.post<{ answer: string; sql?: string | null; data?: Record<string, unknown>[] | null; error?: string | null }>(
        `${API_URL}/api/v1/chat/`,
        { message },
      ),
    )
  }

  fetchLongestJobs(org: string, limit = 10): Promise<LongestJobEntry[]> {
    return firstValueFrom(
      this.http.get<LongestJobEntry[]>(`${API_URL}/api/v1/orgs/${org}/performance/longest-jobs`, {
        params: { limit: String(limit) },
      }),
    )
  }

  fetchLongestWorkflows(org: string, limit = 10): Promise<LongestWorkflowEntry[]> {
    return firstValueFrom(
      this.http.get<LongestWorkflowEntry[]>(`${API_URL}/api/v1/orgs/${org}/performance/longest-workflows`, {
        params: { limit: String(limit) },
      }),
    )
  }

  fetchRunnerBreakdown(org: string): Promise<RunnerBreakdownEntry[]> {
    return firstValueFrom(
      this.http.get<RunnerBreakdownEntry[]>(`${API_URL}/api/v1/orgs/${org}/performance/runner-breakdown`),
    )
  }

  async fetchPRReviews(): Promise<PRReview[]> {
    const data = await firstValueFrom(
      this.http.get<{ reviews: PRReview[]; total: number }>(`${API_URL}/api/v1/pr-reviews/`),
    )
    return data.reviews
  }

  async fetchAgentFleetSummary(org: string): Promise<AgentFleetSummary> {
    const params: Record<string, string> = org ? { org_login: org } : {}
    return firstValueFrom(
      this.http.get<AgentFleetSummary>(`${API_URL}/api/v1/agent-runs/summary`, { params }),
    )
  }

  async fetchAgentRuns(org: string, agentName?: string): Promise<AgentRun[]> {
    const params: Record<string, string> = {}
    if (org) params['org_login'] = org
    if (agentName) params['agent_name'] = agentName
    const data = await firstValueFrom(
      this.http.get<{ runs: AgentRun[]; total: number }>(`${API_URL}/api/v1/agent-runs/`, { params }),
    )
    return data.runs
  }

  fetchPRReview(id: string): Promise<PRReview> {
    return firstValueFrom(this.http.get<PRReview>(`${API_URL}/api/v1/pr-reviews/${id}`))
  }

  getSimilarRemediations(remediationId: string, limit = 5): Promise<Remediation[]> {
    return firstValueFrom(
      this.http.get<Remediation[]>(`${API_URL}/api/v1/remediations/${remediationId}/similar`, {
        params: { limit: String(limit) },
      }),
    )
  }

  buildDependencyGraph(org: string, repo: string, ref = 'main'): Promise<Graph> {
    return firstValueFrom(
      this.http.post<Graph>(`${API_URL}/api/v1/orgs/${org}/repos/${repo}/dependency-graph/build`, { ref }),
    )
  }

  fetchDependencyGraph(org: string, repo: string): Promise<GraphDetail> {
    return firstValueFrom(this.http.get<GraphDetail>(`${API_URL}/api/v1/orgs/${org}/repos/${repo}/dependency-graph`))
  }

  async fetchDependencyGraphHistory(org: string, repo: string): Promise<Graph[]> {
    const data = await firstValueFrom(
      this.http.get<{ graphs: Graph[]; total: number }>(`${API_URL}/api/v1/orgs/${org}/repos/${repo}/dependency-graph/history`),
    )
    return data.graphs
  }

  fetchKnowledgeGraph(org: string): Promise<GraphDetail> {
    return firstValueFrom(this.http.get<GraphDetail>(`${API_URL}/api/v1/orgs/${org}/knowledge-graph`))
  }

  async buildKnowledgeGraph(org: string): Promise<void> {
    await firstValueFrom(this.http.post(`${API_URL}/api/v1/orgs/${org}/knowledge-graph/build`, {}))
  }

  async fetchRunJobs(runId: string): Promise<JobRunData[]> {
    const data = await firstValueFrom(this.http.get<{ jobs: JobRunData[] }>(`${API_URL}/api/v1/runs/${runId}/jobs`))
    return data.jobs
  }

  async fetchRunCriticalPath(runId: string): Promise<CriticalPathData | null> {
    try {
      return await firstValueFrom(this.http.get<CriticalPathData>(`${API_URL}/api/v1/runs/${runId}/critical-path`))
    } catch {
      return null
    }
  }

  async fetchTemplates(org: string): Promise<WorkflowTemplate[]> {
    const data = await firstValueFrom(this.http.get<{ templates: WorkflowTemplate[] }>(`${API_URL}/api/v1/orgs/${org}/templates`))
    return data.templates
  }

  createTemplate(org: string, body: { name: string; description?: string; template_yaml: string }): Promise<WorkflowTemplate> {
    return firstValueFrom(this.http.post<WorkflowTemplate>(`${API_URL}/api/v1/orgs/${org}/templates`, body))
  }

  async deactivateTemplate(org: string, templateId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${API_URL}/api/v1/orgs/${org}/templates/${templateId}`))
  }

  async analyzeStandardization(org: string, repo: string, ref = 'main'): Promise<void> {
    await firstValueFrom(this.http.post(`${API_URL}/api/v1/orgs/${org}/repos/${repo}/standardization/analyze`, { ref }))
  }

  async fetchTemplateDiffs(org: string, repo: string): Promise<TemplateDiff[]> {
    const data = await firstValueFrom(
      this.http.get<{ diffs: TemplateDiff[] }>(`${API_URL}/api/v1/orgs/${org}/repos/${repo}/standardization/diffs`),
    )
    return data.diffs
  }

  async fetchPatternClusters(org: string): Promise<PatternCluster[]> {
    const data = await firstValueFrom(
      this.http.get<{ patterns: PatternCluster[] }>(`${API_URL}/api/v1/orgs/${org}/standardization/patterns`),
    )
    return data.patterns
  }

  async fetchGovernanceDocuments(org: string): Promise<GovernanceDocument[]> {
    const data = await firstValueFrom(
      this.http.get<{ documents: GovernanceDocument[] }>(`${API_URL}/api/v1/orgs/${org}/governance/documents`),
    )
    return data.documents
  }

  uploadGovernanceDocument(org: string, docType: GovernanceDocType, title: string, file: File): Promise<GovernanceDocument> {
    const formData = new FormData()
    formData.append('file', file)
    return firstValueFrom(
      this.http.post<GovernanceDocument>(`${API_URL}/api/v1/orgs/${org}/governance/documents`, formData, {
        params: { doc_type: docType, title },
      }),
    )
  }

  async analyzeGovernance(
    org: string,
    repo: string,
    body: { mode: 'framework' | 'document'; ref?: string; framework?: string; document_id?: string },
  ): Promise<void> {
    await firstValueFrom(
      this.http.post(`${API_URL}/api/v1/orgs/${org}/repos/${repo}/governance/analyze`, { ref: 'main', ...body }),
    )
  }

  async fetchComplianceFindings(org: string, repo: string): Promise<ComplianceFinding[]> {
    const data = await firstValueFrom(
      this.http.get<{ findings: ComplianceFinding[] }>(`${API_URL}/api/v1/orgs/${org}/repos/${repo}/governance/findings`),
    )
    return data.findings
  }

  async analyzeOptimization(org: string, repo: string, workflowFile: string, ref = 'main'): Promise<void> {
    await firstValueFrom(
      this.http.post(`${API_URL}/api/v1/orgs/${org}/repos/${repo}/optimization/analyze`, { workflow_file: workflowFile, ref }),
    )
  }

  async fetchOptimizationRecommendations(org: string, repo: string): Promise<OptimizationRecommendation[]> {
    const data = await firstValueFrom(
      this.http.get<{ recommendations: OptimizationRecommendation[] }>(`${API_URL}/api/v1/orgs/${org}/repos/${repo}/optimization/recommendations`),
    )
    return data.recommendations
  }

  fetchSimulation(recommendationId: string): Promise<SimulationRun> {
    return firstValueFrom(
      this.http.get<SimulationRun>(`${API_URL}/api/v1/optimization/recommendations/${recommendationId}/simulation`),
    )
  }

  acceptRecommendation(recommendationId: string): Promise<OptimizationRecommendation> {
    return firstValueFrom(
      this.http.post<OptimizationRecommendation>(`${API_URL}/api/v1/optimization/recommendations/${recommendationId}/accept`, {}),
    )
  }

  rejectRecommendation(recommendationId: string): Promise<OptimizationRecommendation> {
    return firstValueFrom(
      this.http.post<OptimizationRecommendation>(`${API_URL}/api/v1/optimization/recommendations/${recommendationId}/reject`, {}),
    )
  }
}

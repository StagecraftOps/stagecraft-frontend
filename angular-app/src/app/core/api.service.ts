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
}

import axios from 'axios'
import type {
  User,
  Organization,
  Workflow,
  WorkflowRun,
  Remediation,
  AnalyticsData,
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

export default api

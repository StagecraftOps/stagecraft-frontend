export interface User {
  id: string
  login: string
  name: string
  avatar_url: string
  email: string | null
}

export type OrgSyncStatus = 'pending' | 'syncing' | 'completed' | 'failed'

export interface Organization {
  id: string
  login: string
  name: string
  avatar_url: string
  sync_status: OrgSyncStatus
}

export type WorkflowState = 'active' | 'disabled_manually' | 'disabled_inactivity' | 'deleted'

export interface Workflow {
  id: number
  name: string
  path: string
  repo_name: string
  state: WorkflowState
  badge_url: string
}

export type RunStatus = 'queued' | 'in_progress' | 'completed' | 'waiting'
export type RunConclusion =
  | 'success'
  | 'failure'
  | 'neutral'
  | 'cancelled'
  | 'skipped'
  | 'timed_out'
  | 'action_required'
  | null

export interface WorkflowRun {
  id: string
  github_run_id: number
  status: RunStatus
  conclusion: RunConclusion
  org_login?: string
  branch: string
  head_sha: string
  started_at: string | null
  completed_at: string | null
  html_url: string
  workflow_name?: string
  repo_name?: string
}

export type RemediationStatus =
  | 'pending'
  | 'analyzing'
  | 'analyzed'
  | 'pr_raised'
  | 'helpful'
  | 'failed'

export interface Remediation {
  id: string
  workflow_run_id: string
  org_login: string
  repo_name: string
  workflow_file: string
  root_cause: string
  suggested_yaml: string | null
  pr_url: string | null
  pr_number: number | null
  pr_branch: string | null
  status: RemediationStatus
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface TopFailingRepo {
  repo: string
  count: number
}

export interface RunTrendPoint {
  date: string
  success: number
  failed: number
}

export interface AnalyticsData {
  total_runs: number
  failure_rate: number
  success_rate: number
  remediations_raised: number
  top_failing_repos: TopFailingRepo[]
  run_trend: RunTrendPoint[]
}

export type WebSocketEventType =
  | 'run_update'
  | 'remediation_created'
  | 'remediation_updated'
  | 'connected'

export interface WebSocketEvent {
  type: WebSocketEventType
  data?: Record<string, unknown>
}

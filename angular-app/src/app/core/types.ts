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

export type RemediationStatus = 'pending' | 'analyzing' | 'analyzed' | 'pr_raised' | 'helpful' | 'failed'

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
  completed_runs: number
  success_count: number
  failure_count: number
  other_count: number
  failure_rate: number
  success_rate: number
  remediations_raised: number
  avg_analysis_seconds: number | null
  avg_time_to_pr_seconds: number | null
  top_failing_repos: TopFailingRepo[]
  run_trend: RunTrendPoint[]
}

export interface LongestJobEntry {
  job_name: string
  repo_name: string
  workflow_run_id: string
  duration_seconds: number
}

export interface LongestWorkflowEntry {
  workflow_name: string
  repo_name: string
  workflow_run_id: string
  duration_seconds: number
}

export interface RunnerBreakdownEntry {
  runner_labels: string[] | null
  job_count: number
  avg_duration_seconds: number | null
}

export type PRReviewStatus = 'pending' | 'analyzing' | 'completed' | 'failed'

export interface PRReview {
  id: string
  org_login: string
  repo_name: string
  pr_number: number
  pr_url: string
  risk_score: number | null
  findings: string[] | null
  review_summary: string | null
  status: PRReviewStatus
  agent_trace: string[] | null
  created_at: string
  updated_at: string
}

export interface RunsPage {
  runs: WorkflowRun[]
  total: number
}

export interface FetchRunsParams {
  limit?: number
  offset?: number
  org_login?: string
  repo_name?: string
  status?: string
  conclusion?: string
}

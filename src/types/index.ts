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

export type GraphType = 'dependency' | 'knowledge'
export type GraphStatus = 'pending' | 'building' | 'completed' | 'failed'
export type GraphNodeType =
  | 'workflow'
  | 'job'
  | 'reusable_workflow'
  | 'composite_action'
  | 'service'
  | 'external_repo'
  | 'governance_rule'
  | 'app_requirement'
  | 'runtime_metric'
  | 'failure'
export type GraphEdgeType =
  | 'needs'
  | 'uses_reusable'
  | 'uses_composite'
  | 'workflow_call_input'
  | 'needs_output'
  | 'workflow_run_trigger'
  | 'orchestrator_service_dep'
  | 'repository_dispatch'
  | 'matrix_fanout'
  | 'governs'
  | 'applies_to'
  | 'caused_by'
  | 'measured_by'
export type GraphEdgeConfidence = 'certain' | 'heuristic' | 'ambiguous'

export interface GraphNodeData {
  id: string
  node_type: GraphNodeType
  external_key: string
  display_name: string
  workflow_file: string | null
  job_id: string | null
  node_metadata: Record<string, unknown> | null
}

export interface GraphEdgeData {
  id: string
  source_node_id: string
  target_node_id: string
  edge_type: GraphEdgeType
  confidence: GraphEdgeConfidence
  edge_metadata: Record<string, unknown> | null
}

export interface Graph {
  id: string
  org_login: string
  repo_name: string | null
  graph_type: GraphType
  ref: string | null
  status: GraphStatus
  node_count: number
  edge_count: number
  error_message: string | null
  built_at: string | null
  created_at: string
}

export interface GraphDetail extends Graph {
  nodes: GraphNodeData[]
  edges: GraphEdgeData[]
}

export interface JobRunData {
  id: string
  workflow_run_id: string
  github_job_id: number
  job_name: string
  status: string
  conclusion: string | null
  started_at: string | null
  completed_at: string | null
  duration_seconds: number | null
  runner_name: string | null
}

export interface CriticalPathData {
  id: string
  workflow_run_id: string
  total_duration_seconds: number
  critical_path_job_ids: string[]
  longest_job_id: string | null
  computed_at: string
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

export interface WorkflowTemplate {
  id: string
  org_login: string
  name: string
  description: string | null
  template_yaml: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface VersionDrift {
  component: string
  template_version: string
  workflow_version: string
}

export interface TemplateDiffSummary {
  missing_components: string[]
  extra_components: string[]
  version_drift: VersionDrift[]
  adoption_score: number
  // LLM layer (WHY the gap matters, not just what it is) -- absent when the
  // diff is fully compliant (nothing to narrate) or the Bedrock call failed
  // (best-effort, see app.tasks.standardization.run_template_diff_task).
  narrative?: string
}

export interface TemplateDiff {
  id: string
  org_login: string
  repo_name: string
  workflow_file: string
  template_id: string
  diff_summary: TemplateDiffSummary
  adoption_score: number
  computed_at: string
}

export interface PatternClusterSignature {
  components: string[]
  // 'exact' = found by byte-identical signature hashing (find_repeated_patterns).
  // 'semantic' = jobs whose signatures were similar but not identical, an LLM
  // judged them the same pattern anyway (find_near_miss_groups +
  // BedrockRemediationClient.judge_pattern_cluster) -- only 'semantic'
  // clusters carry pattern_name/draft_template_yaml, since exact clusters
  // are never sent through that LLM judgment step.
  match_type?: 'exact' | 'semantic'
  pattern_name?: string
  draft_template_yaml?: string
}

export interface PatternCluster {
  id: string
  org_login: string
  pattern_hash: string
  pattern_signature: PatternClusterSignature
  occurrence_count: number
  example_workflow_files: string[]
  computed_at: string
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

export type GovernanceDocType = 'governance_policy' | 'app_profile'

export interface GovernanceDocument {
  id: string
  org_login: string
  doc_type: GovernanceDocType
  title: string
  source_filename: string | null
  structured_requirements: { requirements: { id: string; description: string }[] } | null
  created_at: string
  updated_at: string
}

export type ComplianceStatus = 'compliant' | 'gap' | 'not_applicable'

export interface ComplianceFinding {
  id: string
  org_login: string
  repo_name: string
  workflow_file: string
  governance_document_id: string | null
  requirement_id: string
  status: ComplianceStatus
  finding_detail: string
  remediation_suggestion: string | null
  severity: string
  computed_at: string
}

export type OptimizationStatus = 'proposed' | 'accepted' | 'rejected' | 'applied'

export interface OptimizationRecommendation {
  id: string
  org_login: string
  repo_name: string
  workflow_file: string
  graph_id: string
  recommendation_type: string
  description: string
  proposed_yaml_diff: string | null
  estimated_time_savings_seconds: number
  confidence_score: number
  status: OptimizationStatus
  agent_trace: string[] | null
  created_at: string
  updated_at: string
}

export interface SimulationRun {
  id: string
  recommendation_id: string
  baseline_critical_path_seconds: number
  simulated_critical_path_seconds: number
  delta_seconds: number
  computed_at: string
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

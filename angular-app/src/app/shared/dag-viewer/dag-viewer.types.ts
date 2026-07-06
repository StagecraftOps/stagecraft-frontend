export const NODE_WIDTH = 200
export const NODE_HEIGHT = 56

export const NODE_COLORS: Record<string, string> = {
  workflow: '#0ea5e9',
  job: '#3b82f6',
  reusable_workflow: '#8b5cf6',
  composite_action: '#ec4899',
  service: '#10b981',
  external_repo: '#6b7280',
  governance_rule: '#f59e0b',
  app_requirement: '#f59e0b',
  runtime_metric: '#06b6d4',
  failure: '#ef4444',
}

export const TYPE_LABELS: Record<string, string> = {
  workflow: 'Workflows',
  job: 'Jobs',
  reusable_workflow: 'Reusable workflows',
  composite_action: 'Composite actions',
  service: 'Services',
  external_repo: 'External repos',
  governance_rule: 'Governance rules',
  app_requirement: 'App requirements',
  runtime_metric: 'Runtime metrics',
  failure: 'Failures',
}

export interface DisplayNode {
  id: string
  label: string
  nodeType: string | null
  emphasize?: boolean
}

export interface DisplayEdge {
  id: string
  source_node_id: string
  target_node_id: string
  edge_type: string
  confidence: 'certain' | 'heuristic' | 'ambiguous'
  count?: number
}

export interface PositionedNode extends DisplayNode {
  x: number
  y: number
}

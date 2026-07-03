'use client'

import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import '@xyflow/react/dist/style.css'
import type { GraphNodeData, GraphEdgeData, GraphEdgeConfidence } from '@/types'

const NODE_WIDTH = 200
const NODE_HEIGHT = 56

const NODE_COLORS: Record<string, string> = {
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

const EDGE_STYLE_BY_CONFIDENCE: Record<GraphEdgeConfidence, { strokeDasharray?: string; stroke: string }> = {
  certain: { stroke: '#94a3b8' },
  heuristic: { strokeDasharray: '6 3', stroke: '#f59e0b' },
  ambiguous: { strokeDasharray: '2 4', stroke: '#ef4444' },
}

function layoutWithDagre(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80 })

  nodes.forEach((node) => g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))
  edges.forEach((edge) => g.setEdge(edge.source, edge.target))

  dagre.layout(g)

  return nodes.map((node) => {
    const { x, y } = g.node(node.id)
    return { ...node, position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 } }
  })
}

interface DagViewerProps {
  nodes: GraphNodeData[]
  edges: GraphEdgeData[]
  className?: string
}

export function DagViewer({ nodes, edges, className }: DagViewerProps) {
  const { flowNodes, flowEdges } = useMemo(() => {
    const rfNodes: Node[] = nodes.map((n) => ({
      id: n.id,
      position: { x: 0, y: 0 },
      data: { label: n.display_name },
      style: {
        background: NODE_COLORS[n.node_type] ?? '#64748b',
        color: 'white',
        borderRadius: 8,
        fontSize: 12,
        padding: 8,
        width: NODE_WIDTH,
      },
    }))

    const rfEdges: Edge[] = edges.map((e) => ({
      id: e.id,
      source: e.source_node_id,
      target: e.target_node_id,
      label: e.edge_type.replace(/_/g, ' '),
      animated: e.confidence === 'heuristic',
      style: EDGE_STYLE_BY_CONFIDENCE[e.confidence],
      labelStyle: { fontSize: 10, fill: '#64748b' },
    }))

    return { flowNodes: layoutWithDagre(rfNodes, rfEdges), flowEdges: rfEdges }
  }, [nodes, edges])

  return (
    <div className={className ?? 'h-[600px] w-full rounded-lg border border-zinc-200 dark:border-zinc-800'}>
      <ReactFlow nodes={flowNodes} edges={flowEdges} fitView minZoom={0.1} maxZoom={2}>
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  )
}

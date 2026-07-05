'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { Maximize2, Minimize2 } from 'lucide-react'
import '@xyflow/react/dist/style.css'
import type { GraphNodeData, GraphEdgeData, GraphEdgeConfidence } from '@/types'

const NODE_WIDTH = 200
const NODE_HEIGHT = 56
const IMG_MAX = 4000

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

const TYPE_LABELS: Record<string, string> = {
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

const EDGE_STYLE_BY_CONFIDENCE: Record<GraphEdgeConfidence, { strokeDasharray?: string; stroke: string }> = {
  certain: { stroke: '#94a3b8' },
  heuristic: { strokeDasharray: '6 3', stroke: '#f59e0b' },
  ambiguous: { strokeDasharray: '2 4', stroke: '#ef4444' },
}

function layoutWithDagre(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  // Wider spacing than the default — with hundreds of nodes the graph is only
  // legible once you filter/focus, and generous gaps keep the labels readable.
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 120 })

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

function DagViewerInner({ nodes, edges }: DagViewerProps) {
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [focusId, setFocusId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const { getNodes, fitView } = useReactFlow()

  const typeCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const n of nodes) m[n.node_type] = (m[n.node_type] ?? 0) + 1
    return m
  }, [nodes])

  // Undirected adjacency, so focusing a node shows both its dependencies and
  // its dependents.
  const neighborsOf = useMemo(() => {
    const adj = new Map<string, Set<string>>()
    for (const e of edges) {
      if (!adj.has(e.source_node_id)) adj.set(e.source_node_id, new Set())
      if (!adj.has(e.target_node_id)) adj.set(e.target_node_id, new Set())
      adj.get(e.source_node_id)!.add(e.target_node_id)
      adj.get(e.target_node_id)!.add(e.source_node_id)
    }
    return adj
  }, [edges])

  const focusName = focusId ? nodes.find((n) => n.id === focusId)?.display_name : null

  const { flowNodes, flowEdges } = useMemo(() => {
    let visible: Set<string>
    if (focusId) {
      visible = new Set<string>([focusId])
      neighborsOf.get(focusId)?.forEach((id) => visible.add(id))
    } else {
      visible = new Set(nodes.filter((n) => !hidden.has(n.node_type)).map((n) => n.id))
    }

    const q = query.trim().toLowerCase()

    const rfNodes: Node[] = nodes
      .filter((n) => visible.has(n.id))
      .map((n) => {
        const match = q ? n.display_name.toLowerCase().includes(q) : true
        return {
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
            opacity: q && !match ? 0.15 : 1,
            outline: q && match ? '3px solid #fbbf24' : undefined,
          },
        }
      })

    const rfEdges: Edge[] = edges
      .filter((e) => visible.has(e.source_node_id) && visible.has(e.target_node_id))
      .map((e) => ({
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        label: e.edge_type.replace(/_/g, ' '),
        animated: e.confidence === 'heuristic',
        style: EDGE_STYLE_BY_CONFIDENCE[e.confidence],
        labelStyle: { fontSize: 10, fill: '#64748b' },
      }))

    return { flowNodes: layoutWithDagre(rfNodes, rfEdges), flowEdges: rfEdges }
  }, [nodes, edges, hidden, query, focusId, neighborsOf])

  // Re-fit the viewport whenever the visible set changes (filter/focus), so the
  // user always lands on a framed view instead of an off-screen cluster.
  useEffect(() => {
    const t = setTimeout(() => fitView({ duration: 300, padding: 0.15 }), 60)
    return () => clearTimeout(t)
  }, [hidden, focusId, expanded, fitView])

  // Esc exits the expanded (landscape) view.
  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded])

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => setFocusId(node.id), [])

  const toggleType = (t: string) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })

  const download = useCallback(
    async (format: 'png' | 'pdf') => {
      const el = document.querySelector('.react-flow__viewport') as HTMLElement | null
      if (!el) return
      const bounds = getNodesBounds(getNodes())
      const width = Math.min(Math.max(bounds.width + 200, 800), IMG_MAX)
      const height = Math.min(Math.max(bounds.height + 200, 600), IMG_MAX)
      const vp = getViewportForBounds(bounds, width, height, 0.1, 2, 0.1)

      const dataUrl = await toPng(el, {
        backgroundColor: '#ffffff',
        width,
        height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`,
        },
      })

      if (format === 'png') {
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = 'dependency-graph.png'
        a.click()
        return
      }

      const pdf = new jsPDF({
        orientation: width >= height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [width, height],
      })
      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height)
      pdf.save('dependency-graph.pdf')
    },
    [getNodes],
  )

  const presentTypes = Object.keys(typeCounts).sort()
  const btn =
    'rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'

  return (
    <div
      className={
        expanded
          ? 'fixed inset-0 z-50 flex flex-col gap-3 bg-white p-4 dark:bg-zinc-950'
          : 'flex flex-col gap-3'
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search nodes…"
          className="w-56 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        {focusId && (
          <button onClick={() => setFocusId(null)} className={btn}>
            ← Clear focus{focusName ? `: ${focusName}` : ''}
          </button>
        )}
        <div className="ml-auto flex gap-2">
          <button onClick={() => setExpanded((v) => !v)} className={btn} title={expanded ? 'Exit expanded view (Esc)' : 'Expand to full screen'}>
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {expanded ? 'Exit fullscreen' : 'Expand'}
          </button>
          <button onClick={() => download('png')} className={btn}>
            Export PNG
          </button>
          <button onClick={() => download('pdf')} className={btn}>
            Export PDF
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {presentTypes.map((t) => {
          const off = hidden.has(t)
          return (
            <button
              key={t}
              onClick={() => toggleType(t)}
              title={off ? 'Hidden — click to show' : 'Shown — click to hide'}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
                off
                  ? 'border-zinc-200 bg-zinc-100 text-zinc-400 line-through dark:border-zinc-800 dark:bg-zinc-900'
                  : 'border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
              }`}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: NODE_COLORS[t] ?? '#64748b', opacity: off ? 0.4 : 1 }}
              />
              {TYPE_LABELS[t] ?? t} ({typeCounts[t]})
            </button>
          )
        })}
      </div>

      <div
        className={
          expanded
            ? 'w-full flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800'
            : 'h-[calc(100vh-260px)] min-h-[560px] w-full rounded-lg border border-zinc-200 dark:border-zinc-800'
        }
      >
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodeClick={onNodeClick}
          fitView
          minZoom={0.05}
          maxZoom={2}
        >
          <Background />
          <Controls />
          <MiniMap pannable zoomable nodeColor={(n) => (n.style?.background as string) ?? '#64748b'} />
        </ReactFlow>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Click any node to focus on it and its direct dependencies; use the type chips to hide
        categories, or search to highlight. Dashed amber edges are heuristically detected
        (e.g. repository_dispatch); dashed red edges have ambiguous confidence (e.g. a
        runtime-gated composite action step) and may not reflect the exact runtime path.
      </p>
    </div>
  )
}

export function DagViewer({ nodes, edges }: DagViewerProps) {
  return (
    <ReactFlowProvider>
      <DagViewerInner nodes={nodes} edges={edges} />
    </ReactFlowProvider>
  )
}

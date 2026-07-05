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

const TYPE_LABELS: Record<string, string> = {
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

const EDGE_STYLE_BY_CONFIDENCE: Record<GraphEdgeConfidence, { strokeDasharray?: string; stroke: string }> = {
  certain: { stroke: '#94a3b8' },
  heuristic: { strokeDasharray: '6 3', stroke: '#f59e0b' },
  ambiguous: { strokeDasharray: '2 4', stroke: '#ef4444' },
}

// Client-only rendering concepts -- not real API node_type/edge_type values,
// so kept local to this component rather than in the shared types file.
type CollapsedEdge = {
  id: string
  source_node_id: string
  target_node_id: string
  kind: 'workflow_run_trigger' | 'calls_reusable'
  count: number
}
type StubNode = { id: string; label: string; resolvedWorkflowId: string | null }
type StubEdge = { id: string; source: string; target: string; edge_type: string }

// Normalized shapes the render pipeline consumes regardless of which level
// (collapsed workflow-to-workflow, or drilled into one workflow's jobs) is
// active -- nodeType: null marks a stub (external-reference) node.
type DisplayNode = { id: string; label: string; nodeType: string | null }
type DisplayEdge = {
  id: string
  source_node_id: string
  target_node_id: string
  edge_type: string
  confidence: GraphEdgeConfidence
  count?: number
}

function layoutWithDagre(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  // rankdir 'TB' spreads same-rank nodes horizontally (side by side) and
  // stacks ranks vertically — with a heavily-populated rank (e.g. hundreds
  // of jobs under one workflow), that reads as a wide, landscape-shaped
  // graph that suits a wide desktop screen, instead of 'LR' which would
  // stack that same rank into one very tall, narrow column.
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 120 })

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
  // null => collapsed (workflow-to-workflow) view, the default; set to a
  // workflow node's id => drilled into that workflow's internal jobs.
  const [drilledWorkflowId, setDrilledWorkflowId] = useState<string | null>(null)
  const { getNodes, fitView } = useReactFlow()

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
  const workflowNodes = useMemo(() => nodes.filter((n) => n.node_type === 'workflow'), [nodes])
  const workflowNodeByFile = useMemo(() => {
    const m = new Map<string, GraphNodeData>()
    for (const n of workflowNodes) if (n.workflow_file) m.set(n.workflow_file, n)
    return m
  }, [workflowNodes])
  const jobsByWorkflowFile = useMemo(() => {
    const m = new Map<string, GraphNodeData[]>()
    for (const n of nodes) {
      if (n.node_type !== 'job' || !n.workflow_file) continue
      if (!m.has(n.workflow_file)) m.set(n.workflow_file, [])
      m.get(n.workflow_file)!.push(n)
    }
    return m
  }, [nodes])

  // Collapsed (default) level: one node per workflow, edges aggregated from
  // real workflow_run_trigger edges plus uses_reusable/matrix_fanout edges
  // whose target resolved (via the backend bridging fix) to a real workflow
  // node -- an unresolved external/marketplace reference has no workflow to
  // point at collapsed, so it's simply omitted here (still visible as a
  // drill-down stub).
  const collapsed = useMemo(() => {
    const collapsedNodes: GraphNodeData[] = workflowNodes.map((n) => ({ ...n }))

    const agg = new Map<string, { source: string; target: string; kind: 'workflow_run_trigger' | 'calls_reusable'; count: number }>()

    for (const e of edges) {
      if (e.edge_type === 'workflow_run_trigger') {
        const key = `${e.source_node_id}->${e.target_node_id}`
        const existing = agg.get(key)
        if (existing) existing.count += 1
        else agg.set(key, { source: e.source_node_id, target: e.target_node_id, kind: 'workflow_run_trigger', count: 1 })
        continue
      }
      if (e.edge_type === 'uses_reusable' || e.edge_type === 'matrix_fanout') {
        const sourceJob = nodeById.get(e.source_node_id)
        const targetNode = nodeById.get(e.target_node_id)
        if (!sourceJob?.workflow_file || !targetNode) continue
        if (targetNode.node_type !== 'workflow') continue
        const sourceWorkflow = workflowNodeByFile.get(sourceJob.workflow_file)
        if (!sourceWorkflow || sourceWorkflow.id === targetNode.id) continue
        const key = `${sourceWorkflow.id}->${targetNode.id}`
        const existing = agg.get(key)
        if (existing) existing.count += 1
        else agg.set(key, { source: sourceWorkflow.id, target: targetNode.id, kind: 'calls_reusable', count: 1 })
      }
      // orchestrator_service_dep / repository_dispatch / needs /
      // needs_output / uses_composite are job- or service-level, not shown
      // at the collapsed workflow-to-workflow level.
    }

    const collapsedEdges: CollapsedEdge[] = Array.from(agg.values()).map((a) => ({
      id: `collapsed::${a.source}->${a.target}`,
      source_node_id: a.source,
      target_node_id: a.target,
      kind: a.kind,
      count: a.count,
    }))

    return { collapsedNodes, collapsedEdges }
  }, [workflowNodes, workflowNodeByFile, edges, nodeById])

  // Drilled level: one workflow's own jobs + composite actions + their
  // internal edges, plus external-reference stubs in both directions
  // (outgoing calls, incoming callers, workflow_run_trigger either way).
  const drilled = useMemo(() => {
    if (!drilledWorkflowId) return null
    const workflow = nodeById.get(drilledWorkflowId)
    if (!workflow?.workflow_file) return null
    const wf = workflow.workflow_file

    const ownJobs = jobsByWorkflowFile.get(wf) ?? []
    const ownIds = new Set(ownJobs.map((n) => n.id))

    const compositeIds = new Set<string>()
    for (const e of edges) {
      if (e.edge_type === 'uses_composite' && ownIds.has(e.source_node_id)) compositeIds.add(e.target_node_id)
    }
    const compositeNodes = Array.from(compositeIds)
      .map((id) => nodeById.get(id))
      .filter((n): n is GraphNodeData => Boolean(n))

    const internalIds = new Set(ownIds)
    compositeIds.forEach((id) => internalIds.add(id))
    const internalEdges = edges.filter(
      (e) =>
        internalIds.has(e.source_node_id) &&
        internalIds.has(e.target_node_id) &&
        (e.edge_type === 'needs' || e.edge_type === 'needs_output' || e.edge_type === 'uses_composite'),
    )

    const stubNodes = new Map<string, StubNode>()
    const stubEdges: StubEdge[] = []

    const addStub = (target: GraphNodeData, edgeId: string, source: string, dest: string, edgeType: string) => {
      const stubId = `stub::${target.external_key}`
      if (!stubNodes.has(stubId)) {
        stubNodes.set(stubId, {
          id: stubId,
          label: target.display_name,
          // Only local (bridged) workflow refs and direct workflow-to-workflow
          // edges resolve to a real workflow node the user can drill into
          // next; external/marketplace refs and service/external_repo
          // targets stay inert.
          resolvedWorkflowId: target.node_type === 'workflow' ? target.id : null,
        })
      }
      stubEdges.push({ id: edgeId, source, target: stubId, edge_type: edgeType })
    }

    for (const e of edges) {
      if (ownIds.has(e.source_node_id) && !internalIds.has(e.target_node_id)) {
        if (e.edge_type === 'uses_reusable' || e.edge_type === 'matrix_fanout' || e.edge_type === 'repository_dispatch') {
          const target = nodeById.get(e.target_node_id)
          if (target) addStub(target, e.id, e.source_node_id, e.target_node_id, e.edge_type)
        }
      }
      if (e.edge_type === 'workflow_run_trigger' && (e.source_node_id === drilledWorkflowId || e.target_node_id === drilledWorkflowId)) {
        const otherId = e.source_node_id === drilledWorkflowId ? e.target_node_id : e.source_node_id
        const other = nodeById.get(otherId)
        if (other) {
          const [src, dst] = e.source_node_id === drilledWorkflowId ? [drilledWorkflowId, otherId] : [otherId, drilledWorkflowId]
          addStub(other, e.id, src, dst, 'workflow_run_trigger')
        }
      }
      if ((e.edge_type === 'uses_reusable' || e.edge_type === 'matrix_fanout') && e.target_node_id === drilledWorkflowId) {
        // incoming: some other workflow's job calls into this one (only
        // possible if this workflow itself is a bridged `uses:` target).
        const source = nodeById.get(e.source_node_id)
        if (source) addStub(source, e.id, e.source_node_id, drilledWorkflowId, e.edge_type)
      }
    }

    return {
      workflow,
      internalNodes: [...ownJobs, ...compositeNodes],
      internalEdges,
      stubNodes: Array.from(stubNodes.values()),
      stubEdges,
    }
  }, [drilledWorkflowId, nodeById, jobsByWorkflowFile, edges])

  // Normalize whichever level is active into a shape the render pipeline
  // below can consume uniformly.
  const { displayNodes, displayEdges } = useMemo(() => {
    if (drilledWorkflowId && drilled) {
      const dNodes: DisplayNode[] = [
        ...drilled.internalNodes.map((n) => ({ id: n.id, label: n.display_name, nodeType: n.node_type })),
        ...drilled.stubNodes.map((s) => ({ id: s.id, label: s.label, nodeType: null })),
      ]
      const dEdges: DisplayEdge[] = [
        ...drilled.internalEdges.map((e) => ({
          id: e.id,
          source_node_id: e.source_node_id,
          target_node_id: e.target_node_id,
          edge_type: e.edge_type,
          confidence: e.confidence,
        })),
        ...drilled.stubEdges.map((e) => ({
          id: e.id,
          source_node_id: e.source,
          target_node_id: e.target,
          edge_type: e.edge_type,
          confidence: 'certain' as GraphEdgeConfidence,
        })),
      ]
      return { displayNodes: dNodes, displayEdges: dEdges }
    }

    const cNodes: DisplayNode[] = collapsed.collapsedNodes.map((n) => {
      const jobCount = n.workflow_file ? jobsByWorkflowFile.get(n.workflow_file)?.length ?? 0 : 0
      return { id: n.id, label: `${n.display_name} - ${jobCount} job${jobCount === 1 ? '' : 's'}`, nodeType: 'workflow' }
    })
    const cEdges: DisplayEdge[] = collapsed.collapsedEdges.map((e) => ({
      id: e.id,
      source_node_id: e.source_node_id,
      target_node_id: e.target_node_id,
      edge_type: e.kind,
      confidence: 'certain',
      count: e.count,
    }))
    return { displayNodes: cNodes, displayEdges: cEdges }
  }, [drilledWorkflowId, drilled, collapsed, jobsByWorkflowFile])

  const typeCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const n of displayNodes) {
      if (n.nodeType === null) continue // stubs are a navigation aid, not a data category
      m[n.nodeType] = (m[n.nodeType] ?? 0) + 1
    }
    return m
  }, [displayNodes])

  // Undirected adjacency, so focusing a node shows both its dependencies and
  // its dependents.
  const neighborsOf = useMemo(() => {
    const adj = new Map<string, Set<string>>()
    for (const e of displayEdges) {
      if (!adj.has(e.source_node_id)) adj.set(e.source_node_id, new Set())
      if (!adj.has(e.target_node_id)) adj.set(e.target_node_id, new Set())
      adj.get(e.source_node_id)!.add(e.target_node_id)
      adj.get(e.target_node_id)!.add(e.source_node_id)
    }
    return adj
  }, [displayEdges])

  const focusName = focusId ? displayNodes.find((n) => n.id === focusId)?.label : null

  const { flowNodes, flowEdges } = useMemo(() => {
    let visible: Set<string>
    if (focusId) {
      visible = new Set<string>([focusId])
      neighborsOf.get(focusId)?.forEach((id) => visible.add(id))
    } else {
      visible = new Set(displayNodes.filter((n) => n.nodeType === null || !hidden.has(n.nodeType)).map((n) => n.id))
    }

    const q = query.trim().toLowerCase()

    const rfNodes: Node[] = displayNodes
      .filter((n) => visible.has(n.id))
      .map((n) => {
        const match = q ? n.label.toLowerCase().includes(q) : true
        const isStub = n.nodeType === null
        return {
          id: n.id,
          position: { x: 0, y: 0 },
          data: { label: n.label },
          style: isStub
            ? {
                background: 'transparent',
                border: '2px dashed #94a3b8',
                color: '#64748b',
                borderRadius: 8,
                fontSize: 12,
                padding: 8,
                width: NODE_WIDTH,
                opacity: q && !match ? 0.15 : 1,
                outline: q && match ? '3px solid #fbbf24' : undefined,
              }
            : {
                background: NODE_COLORS[n.nodeType as string] ?? '#64748b',
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

    const rfEdges: Edge[] = displayEdges
      .filter((e) => visible.has(e.source_node_id) && visible.has(e.target_node_id))
      .map((e) => ({
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        label:
          e.count && e.count > 1
            ? `${e.edge_type.replace(/_/g, ' ')} x${e.count}`
            : e.edge_type.replace(/_/g, ' '),
        animated: e.confidence === 'heuristic',
        style: EDGE_STYLE_BY_CONFIDENCE[e.confidence],
        labelStyle: { fontSize: 10, fill: '#64748b' },
      }))

    return { flowNodes: layoutWithDagre(rfNodes, rfEdges), flowEdges: rfEdges }
  }, [displayNodes, displayEdges, hidden, query, focusId, neighborsOf])

  // Re-fit the viewport whenever the visible set changes (filter/focus/
  // drill), so the user always lands on a framed view instead of an
  // off-screen cluster.
  useEffect(() => {
    const t = setTimeout(() => fitView({ duration: 300, padding: 0.15 }), 60)
    return () => clearTimeout(t)
  }, [hidden, focusId, expanded, drilledWorkflowId, fitView])

  // Esc exits the expanded (landscape) view.
  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded])

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (!drilledWorkflowId) {
        const clicked = nodeById.get(node.id)
        if (clicked?.node_type === 'workflow') {
          setDrilledWorkflowId(node.id)
          setFocusId(null)
          setQuery('')
          return
        }
      } else {
        const stub = drilled?.stubNodes.find((s) => s.id === node.id)
        if (stub?.resolvedWorkflowId) {
          setDrilledWorkflowId(stub.resolvedWorkflowId) // drill sideways into the referenced workflow
          setFocusId(null)
          setQuery('')
          return
        }
        if (stub) return // inert stub (external/marketplace ref, or a service/external_repo target)
      }
      setFocusId(node.id) // existing focus-neighbors behavior, scoped within the active level
    },
    [drilledWorkflowId, nodeById, drilled],
  )

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

      {drilledWorkflowId && (
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <button
            onClick={() => {
              setDrilledWorkflowId(null)
              setFocusId(null)
              setQuery('')
            }}
            className="underline hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            All workflows
          </button>
          <span>/</span>
          <span className="font-medium text-zinc-700 dark:text-zinc-200">{drilled?.workflow.display_name}</span>
        </div>
      )}

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
        {drilledWorkflowId
          ? 'Showing this workflow’s jobs and dependencies. Dashed nodes are external references to other workflows or repos — click a resolvable one to jump straight there. Click "All workflows" to go back.'
          : 'Click a workflow to see its internal jobs and dependencies. Use the type chips to hide categories, or search to highlight.'}
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

'use client'

import { useEffect, useRef, useState } from 'react'
import { GitBranch, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react'

const mockRuns = [
  { workflow: 'CI / Build & Test', repo: 'api-service', branch: 'main', sha: 'a3f2b19', status: 'success', time: '2m 14s' },
  { workflow: 'Deploy to Staging', repo: 'frontend', branch: 'main', sha: 'c7d8e01', status: 'in_progress', time: '—' },
  { workflow: 'CI / Build & Test', repo: 'webhook-service', branch: 'feature/auth', sha: '9b1a44c', status: 'failure', time: '1m 03s' },
  { workflow: 'Terraform Plan', repo: 'infra', branch: 'main', sha: 'f4e3c29', status: 'success', time: '45s' },
  { workflow: 'Security Scan', repo: 'api-service', branch: 'main', sha: 'a3f2b19', status: 'success', time: '3m 52s' },
  { workflow: 'CI / Build & Test', repo: 'remediation-worker', branch: 'fix/retry', sha: '2d9f883', status: 'queued', time: '—' },
]

function StatusIcon({ status }: { status: string }) {
  if (status === 'success') return <CheckCircle2 size={14} className="text-emerald-500" />
  if (status === 'failure') return <XCircle size={14} className="text-rose-500" />
  if (status === 'in_progress') return <Loader2 size={14} className="text-amber-500 animate-spin" />
  return <Clock size={14} className="text-zinc-400" />
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    failure: 'bg-rose-50 text-rose-700 border-rose-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    queued: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  }
  const labels: Record<string, string> = {
    success: 'Success', failure: 'Failed', in_progress: 'Running', queued: 'Queued',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] || map.queued}`}>
      <StatusIcon status={status} />
      {labels[status] || status}
    </span>
  )
}

export function RunsPreviewSection() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="runs" ref={ref} className="py-24 lg:py-32 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Text */}
          <div>
            <span className="inline-flex items-center gap-3 text-sm font-code text-zinc-400 mb-6">
              <span className="w-8 h-px bg-zinc-300" />
              The /runs page
            </span>
            <h2
              className={`font-serif-display text-4xl lg:text-5xl tracking-tight text-zinc-900 mb-6 transition-all duration-700 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              Every run.
              <br />
              Every repo.
              <br />
              <span className="text-amber-500">One screen.</span>
            </h2>
            <p className="text-lg text-zinc-500 leading-relaxed mb-8">
              Filter by org, repo, status, or conclusion. Click any row to see full details.
              When a failure comes in, the AI analysis card appears automatically —
              no manual investigation needed.
            </p>
            <div className="space-y-3">
              {[
                'Filter by org, repo, status, or conclusion',
                'Syncs historical runs on org connect',
                'Live updates via WebSocket as runs progress',
                'Click any row → full run detail + AI analysis',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-zinc-600">
                  <span className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Preview table */}
          <div
            className={`transition-all duration-700 delay-200 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              {/* Toolbar mockup */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 bg-zinc-50">
                <div className="h-7 w-28 bg-zinc-200 rounded-md animate-pulse" />
                <div className="h-7 w-24 bg-zinc-200 rounded-md animate-pulse" />
                <div className="h-7 w-20 bg-zinc-200 rounded-md animate-pulse" />
                <span className="ml-auto text-xs text-zinc-400 font-code">6 runs</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-zinc-50">
                {mockRuns.map((run, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors cursor-pointer ${
                      run.status === 'failure' ? 'bg-rose-50/30' : ''
                    }`}
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? 'none' : 'translateY(4px)',
                      transition: `opacity 0.4s ease ${300 + i * 60}ms, transform 0.4s ease ${300 + i * 60}ms`,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-800 truncate">{run.workflow}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <GitBranch size={10} className="text-zinc-400" />
                        <span className="text-xs text-zinc-400">{run.branch}</span>
                        <span className="text-zinc-200">·</span>
                        <code className="text-xs text-zinc-400 font-code">{run.sha}</code>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-400 font-code hidden sm:block w-20 text-right shrink-0">
                      {run.repo}
                    </span>
                    <StatusBadge status={run.status} />
                    <span className="text-xs text-zinc-400 font-code w-12 text-right shrink-0">
                      {run.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

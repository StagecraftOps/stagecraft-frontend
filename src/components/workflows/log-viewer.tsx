'use client'

import { useState, useMemo } from 'react'
import { Copy, Check, Download, Search } from 'lucide-react'

interface LogViewerProps {
  logs: string
}

const ERROR_RE = /\b(error|err|failed|failure|fatal|exception|traceback)\b/i
const WARN_RE = /\b(warn|warning|deprecated)\b/i

export function LogViewer({ logs }: LogViewerProps) {
  const [copied, setCopied] = useState(false)
  const [query, setQuery] = useState('')

  const lines = useMemo(() => logs.split('\n'), [logs])

  const filtered = useMemo(() => {
    if (!query.trim()) return lines.map((text, i) => ({ text, n: i + 1 }))
    const q = query.toLowerCase()
    return lines
      .map((text, i) => ({ text, n: i + 1 }))
      .filter((l) => l.text.toLowerCase().includes(q))
  }, [lines, query])

  const copy = async () => {
    await navigator.clipboard.writeText(logs)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const download = () => {
    const blob = new Blob([logs], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'workflow-logs.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-lg overflow-hidden border border-zinc-800">
      {}
      <div className="flex items-center gap-2 bg-zinc-800 px-3 py-2">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-400" />
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>
        <div className="flex items-center gap-1.5 ml-3 flex-1 max-w-xs bg-zinc-900 rounded px-2 py-1">
          <Search size={12} className="text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter lines…"
            className="bg-transparent text-xs text-zinc-200 placeholder-zinc-500 outline-none w-full"
          />
        </div>
        <span className="text-xs text-zinc-500 tabular-nums">
          {filtered.length} / {lines.length} lines
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-100 transition-colors px-2 py-1"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          onClick={download}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-100 transition-colors px-2 py-1"
        >
          <Download size={12} />
          Download
        </button>
      </div>

      {}
      <div className="bg-zinc-950 max-h-[520px] overflow-auto font-mono text-xs leading-relaxed">
        <table className="w-full border-collapse">
          <tbody>
            {filtered.map(({ text, n }) => {
              const isError = ERROR_RE.test(text)
              const isWarn = !isError && WARN_RE.test(text)
              const isHeader = text.startsWith('=====')
              return (
                <tr
                  key={n}
                  className={
                    isError
                      ? 'bg-rose-950/40'
                      : isWarn
                        ? 'bg-amber-950/30'
                        : isHeader
                          ? 'bg-zinc-800/50'
                          : ''
                  }
                >
                  <td className="select-none text-right text-zinc-600 pr-3 pl-3 w-12 align-top sticky left-0">
                    {n}
                  </td>
                  <td
                    className={`pr-4 whitespace-pre-wrap break-all ${
                      isError
                        ? 'text-rose-300'
                        : isWarn
                          ? 'text-amber-300'
                          : isHeader
                            ? 'text-zinc-400 font-semibold'
                            : 'text-zinc-300'
                    }`}
                  >
                    {text || ' '}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

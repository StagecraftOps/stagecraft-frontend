'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Loader2, Terminal, ChevronDown, ChevronUp } from 'lucide-react'
import api from '@/lib/api'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sql?: string | null
  data?: Record<string, unknown>[] | null
  error?: string | null
  loading?: boolean
}

interface ChatApiResponse {
  answer: string
  sql?: string | null
  data?: Record<string, unknown>[] | null
  error?: string | null
}

interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'What are the most common root causes of our failures?',
  'How do we usually fix dependency version errors?',
  'Summarize the auth failures and their fixes',
  'What kinds of issues affect agora-api the most?',
  'Have we seen this kind of build error before?',
]

function SqlBlock({ sql }: { sql: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
      >
        <Terminal size={12} />
        {open ? 'Hide SQL' : 'Show SQL'}
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <pre className="mt-2 text-[11px] bg-zinc-900 border border-zinc-700 rounded-md p-3 overflow-x-auto text-emerald-400 font-mono leading-relaxed">
          {sql}
        </pre>
      )}
    </div>
  )
}

function DataTable({ data }: { data: Record<string, unknown>[] }) {
  if (!data.length) return null
  const cols = Object.keys(data[0])
  return (
    <div className="mt-3 overflow-x-auto rounded-md border border-zinc-700">
      <table className="text-[11px] w-full">
        <thead>
          <tr className="bg-zinc-800">
            {cols.map((c) => (
              <th key={c} className="px-3 py-1.5 text-left text-zinc-400 font-medium whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((row, i) => (
            <tr key={i} className="border-t border-zinc-800 hover:bg-zinc-800/50">
              {cols.map((c) => (
                <td key={c} className="px-3 py-1.5 text-zinc-300 whitespace-nowrap max-w-[200px] truncate">
                  {String(row[c] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 10 && (
        <p className="text-[10px] text-zinc-500 text-center py-1.5 border-t border-zinc-800">
          Showing 10 of {data.length} rows
        </p>
      )}
    </div>
  )
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load persistent history on mount
  useEffect(() => {
    api.get<{ messages: HistoryMessage[] }>('/api/v1/chat/history')
      .then(({ data }) => {
        if (data.messages.length > 0) {
          const loaded: ChatMessage[] = data.messages.map((m, i) => ({
            id: `history-${i}`,
            role: m.role,
            content: m.content,
          }))
          setMessages(loaded)
        }
      })
      .catch(() => {/* silently fall through to welcome message */})
      .finally(() => setHistoryLoaded(true))
  }, [])

  const showWelcome = historyLoaded && messages.length === 0

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text }
    const loadingMsg: ChatMessage = {
      id: Date.now().toString() + '-loading',
      role: 'assistant',
      content: '',
      loading: true,
    }
    setMessages((prev) => [...prev, userMsg, loadingMsg])
    setInput('')
    setLoading(true)

    try {
      const { data } = await api.post<ChatApiResponse>('/api/v1/chat/', { message: text })
      setMessages((prev) =>
        prev.map((m) =>
          m.loading
            ? {
                ...m,
                loading: false,
                content: data.answer,
                sql: data.sql,
                data: data.data,
                error: data.error,
              }
            : m
        )
      )
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.loading
            ? { ...m, loading: false, content: 'Something went wrong. Please try again.', error: 'API error' }
            : m
        )
      )
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col h-full max-h-screen bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Bot size={16} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-zinc-100">Pipeline Chat</h1>
          <p className="text-xs text-zinc-500">Ask anything about your CI/CD data</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {showWelcome && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot size={13} className="text-amber-400" />
            </div>
            <div className="max-w-[75%]">
              <div className="rounded-xl px-4 py-2.5 text-sm leading-relaxed bg-zinc-800 text-zinc-100 border border-zinc-700">
                Hi! I&apos;m your AI pipeline assistant. Ask me anything about your CI/CD data — failures, trends, remediations, and more.
              </div>
            </div>
          </div>
        )}
        {!historyLoaded && (
          <div className="flex justify-center py-8">
            <Loader2 size={18} className="animate-spin text-zinc-600" />
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={13} className="text-amber-400" />
              </div>
            )}
            <div className={`max-w-[75%] ${msg.role === 'user' ? 'order-first' : ''}`}>
              <div
                className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-amber-500 text-white ml-auto'
                    : 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                }`}
              >
                {msg.loading ? (
                  <span className="flex items-center gap-2 text-zinc-400">
                    <Loader2 size={14} className="animate-spin" />
                    Thinking…
                  </span>
                ) : (
                  msg.content
                )}
              </div>
              {msg.sql && <SqlBlock sql={msg.sql} />}
              {msg.data && msg.data.length > 0 && <DataTable data={msg.data} />}
              {msg.error && (
                <p className="text-[11px] text-red-400 mt-1 ml-1">{msg.error}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions (only shown when no messages yet) */}
      {showWelcome && (
        <div className="px-6 pb-2">
          <p className="text-xs text-zinc-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-amber-500/50 hover:text-amber-400 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
          className="flex gap-3 items-center"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your pipelines…"
            disabled={loading}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-colors"
          >
            {loading ? <Loader2 size={15} className="animate-spin text-white" /> : <Send size={15} className="text-white" />}
          </button>
        </form>
      </div>
    </div>
  )
}

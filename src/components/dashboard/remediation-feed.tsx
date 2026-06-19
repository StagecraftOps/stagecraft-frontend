import Link from 'next/link'
import { ExternalLink, Bot } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { truncate, formatRelativeTime } from '@/lib/utils'
import type { Remediation } from '@/types'

interface RemediationFeedProps {
  remediations: Remediation[]
}

export function RemediationFeed({ remediations }: RemediationFeedProps) {
  if (remediations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center mb-3">
          <Bot size={20} className="text-amber-500" />
        </div>
        <p className="text-sm text-zinc-500">No remediations yet</p>
        <p className="text-xs text-zinc-400 mt-1">AI fixes will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {remediations.map((rem) => (
        <div
          key={rem.id}
          className="flex items-start gap-3 p-3 rounded-lg border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50 transition-colors"
        >
          <div className="w-7 h-7 bg-amber-50 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bot size={14} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-zinc-700 truncate">
                {rem.repo_name}
              </span>
              <Badge status={rem.status} showDot={false} />
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
              {truncate(rem.root_cause, 80)}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs text-zinc-400">
                {formatRelativeTime(rem.created_at)}
              </span>
              {rem.pr_url && (
                <a
                  href={rem.pr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
                >
                  View PR #{rem.pr_number}
                  <ExternalLink size={10} />
                </a>
              )}
              <Link
                href={`/remediation/${rem.id}`}
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                Details
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

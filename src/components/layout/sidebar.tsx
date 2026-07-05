'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard,
  GitBranch,
  Workflow,
  ListChecks,
  Wrench,
  Gauge,
  Layers,
  GitPullRequest,
  ShieldCheck,
  Zap,
  Network,
  BarChart2,
  MessageSquare,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { useOrg } from '@/lib/org-context'
import type { User } from '@/types'

const navSections = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Analytics', href: '/analytics', icon: BarChart2 },
      { label: 'Performance', href: '/performance', icon: Gauge },
    ],
  },
  {
    section: 'Pipelines',
    items: [
      { label: 'Runs', href: '/runs', icon: ListChecks },
      { label: 'Workflows', href: '/workflows', icon: GitBranch },
      { label: 'Dependency Graph', href: '/dependency-graph', icon: Workflow },
    ],
  },
  {
    section: 'AI Agents',
    items: [
      { label: 'Remediation', href: '/remediation', icon: Wrench },
      { label: 'Peer Review', href: '/pr-reviews', icon: GitPullRequest },
      { label: 'Pipeline Chat', href: '/chat', icon: MessageSquare },
    ],
  },
  {
    section: 'Quality',
    items: [
      { label: 'Governance', href: '/governance', icon: ShieldCheck },
      { label: 'Standardization', href: '/standardization', icon: Layers },
      { label: 'Optimization', href: '/optimization', icon: Zap },
      { label: 'Knowledge Graph', href: '/knowledge-graph', icon: Network },
    ],
  },
]

const settingsItem = { label: 'Settings', href: '/settings', icon: Settings }

interface SidebarProps {
  user: User | null
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const { orgs, currentOrg, setOrg } = useOrg()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const renderLink = (item: { label: string; href: string; icon: typeof Settings }) => {
    const active = isActive(item.href)
    const Icon = item.icon
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          active
            ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-l-2 border-amber-500 rounded-l-none pl-[calc(0.75rem-2px)]'
            : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
        )}
      >
        <Icon size={16} className={cn('flex-shrink-0', active ? 'text-amber-600' : 'text-zinc-400')} />
        <span className="flex-1">{item.label}</span>
      </Link>
    )
  }

  return (
    <aside className="w-60 h-screen flex flex-col bg-white border-r border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <span
          className="text-zinc-900 dark:text-zinc-100 tracking-tight"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '1.25rem' }}
        >
          Stagecraft
        </span>
        <ThemeToggle />
      </div>

      {/* Org picker — shared across every page via OrgProvider */}
      {orgs.length > 0 && (
        <div className="px-3 pt-3">
          {orgs.length > 1 ? (
            <select
              value={currentOrg}
              onChange={(e) => setOrg(e.target.value)}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {orgs.map((o) => (
                <option key={o.login} value={o.login}>{o.name || o.login}</option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-600 dark:text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="truncate">{orgs[0].name || orgs[0].login}</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {navSections.map((group) => (
          <div key={group.section} className="mb-4">
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {group.section}
            </p>
            <div className="space-y-0.5">{group.items.map(renderLink)}</div>
          </div>
        ))}
      </nav>

      {/* Settings pinned above the user footer */}
      <div className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-800">
        {renderLink(settingsItem)}
      </div>

      {/* User footer */}
      {user && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.login}
                width={32}
                height={32}
                className="rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-zinc-600">
                  {user.login[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                {user.name || user.login}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">@{user.login}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' })
              window.location.href = '/'
            }}
            className="mt-3 flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-xs text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <LogOut size={14} />
            Disconnect
          </button>
        </div>
      )}
    </aside>
  )
}

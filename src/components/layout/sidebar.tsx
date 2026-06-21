'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard,
  GitBranch,
  ListChecks,
  Wrench,
  BarChart2,
  MessageSquare,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import type { User } from '@/types'

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Workflows',
    href: '/workflows',
    icon: GitBranch,
  },
  {
    label: 'Runs',
    href: '/runs',
    icon: ListChecks,
  },
  {
    label: 'Remediation',
    href: '/remediation',
    icon: Wrench,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart2,
  },
  {
    label: 'Pipeline Chat',
    href: '/chat',
    icon: MessageSquare,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

interface SidebarProps {
  user: User | null
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-60 h-screen flex flex-col bg-white border-r border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <span
          className="text-zinc-900 dark:text-zinc-100 tracking-tight"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '1.25rem' }}
        >
          aGorA
        </span>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
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
              <Icon
                size={16}
                className={cn(
                  'flex-shrink-0',
                  active ? 'text-amber-600' : 'text-zinc-400'
                )}
              />
              <span className="flex-1">{item.label}</span>
              {'beta' in item && item.beta && (
                <span className="text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-1.5 py-0.5 leading-none">
                  β
                </span>
              )}
            </Link>
          )
        })}
      </nav>

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

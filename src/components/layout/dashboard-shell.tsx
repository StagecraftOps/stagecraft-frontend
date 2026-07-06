'use client'

import { OrgProvider } from '@/lib/org-context'
import { Sidebar } from '@/components/layout/sidebar'
import type { User } from '@/types'

export function DashboardShell({
  user,
  children,
}: {
  user: User | null
  children: React.ReactNode
}) {
  return (
    <OrgProvider>
      <div className="app-shell flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
        <Sidebar user={user} />
        <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950">{children}</main>
      </div>
    </OrgProvider>
  )
}

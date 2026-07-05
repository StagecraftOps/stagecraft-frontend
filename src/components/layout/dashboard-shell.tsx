'use client'

import { OrgProvider } from '@/lib/org-context'
import { Sidebar } from '@/components/layout/sidebar'
import type { User } from '@/types'

/**
 * Client shell for the authenticated area. The (dashboard) layout stays a
 * server component (cookie auth + redirect); this wraps the sidebar and page
 * content in the OrgProvider so the sidebar's org picker and every page read
 * one shared org selection.
 */
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

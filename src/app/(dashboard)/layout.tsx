import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { AUTH_COOKIE_NAME } from '@/lib/config'
import type { User } from '@/types'

const SERVER_API_URL =
  process.env.API_URL_INTERNAL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000'

async function getUser(): Promise<User | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(AUTH_COOKIE_NAME)
    if (!token) return null

    const res = await fetch(`${SERVER_API_URL}/api/v1/auth/me`, {
      headers: { Cookie: `${AUTH_COOKIE_NAME}=${token.value}` },
      cache: 'no-store',
    })

    if (!res.ok) return null
    return (await res.json()) as User
  } catch {
    return null
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect('/')
  }

  return <DashboardShell user={user}>{children}</DashboardShell>
}

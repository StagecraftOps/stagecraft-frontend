import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import type { User } from '@/types'

const SERVER_API_URL =
  process.env.API_URL_INTERNAL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000'

async function getUser(): Promise<User | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('agora_token')
    if (!token) return null

    const res = await fetch(`${SERVER_API_URL}/api/v1/auth/me`, {
      headers: { Cookie: `agora_token=${token.value}` },
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

  return (
    <div className="app-shell flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
        {children}
      </main>
    </div>
  )
}

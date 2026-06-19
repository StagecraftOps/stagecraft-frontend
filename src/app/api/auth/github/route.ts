import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { API_URL } from '@/lib/config'

export async function GET(request: NextRequest) {
  const callbackUrl = `${API_URL}/api/v1/auth/github`

  const { searchParams } = new URL(request.url)
  const params = searchParams.toString()

  redirect(params ? `${callbackUrl}?${params}` : callbackUrl)
}

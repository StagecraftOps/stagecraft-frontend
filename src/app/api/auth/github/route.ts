import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { API_URL } from '@/lib/config'
import { getRequestOrigin } from '@/lib/request-origin'

export async function GET(request: NextRequest) {
  // Always use the request's own origin so the user stays on the same domain
  // (custom domain or NLB). Using API_URL here would bounce a custom-domain
  // user to the NLB, causing a redirect_uri mismatch on the GitHub OAuth side.
  const origin = getRequestOrigin(request)
  const callbackUrl = new URL('/api/v1/auth/github', origin).toString()

  const { searchParams } = new URL(request.url)
  const params = searchParams.toString()

  redirect(params ? `${callbackUrl}?${params}` : callbackUrl)
}

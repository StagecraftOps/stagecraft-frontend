import { NextRequest, NextResponse } from 'next/server'
import { API_URL } from '@/lib/config'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code') ?? ''
  const state = searchParams.get('state') ?? ''

  // When API_URL is empty (same-domain path routing), use the request origin
  // so NextResponse.redirect gets an absolute URL as required by Next.js
  const base = API_URL || request.nextUrl.origin
  const backendUrl = `${base}/api/v1/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`

  return NextResponse.redirect(backendUrl)
}

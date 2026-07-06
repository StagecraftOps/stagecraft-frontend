import { NextRequest, NextResponse } from 'next/server'
import { API_URL } from '@/lib/config'
import { getRequestOrigin } from '@/lib/request-origin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code') ?? ''
  const state = searchParams.get('state') ?? ''

  const base = API_URL || getRequestOrigin(request)
  const backendUrl = new URL('/api/v1/auth/callback', base)
  backendUrl.searchParams.set('code', code)
  backendUrl.searchParams.set('state', state)

  return NextResponse.redirect(backendUrl)
}

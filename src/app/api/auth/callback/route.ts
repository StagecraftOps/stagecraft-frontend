import { NextRequest, NextResponse } from 'next/server'
import { API_URL } from '@/lib/config'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code') ?? ''
  const state = searchParams.get('state') ?? ''

  const backendUrl = `${API_URL}/api/v1/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`

  return NextResponse.redirect(backendUrl)
}

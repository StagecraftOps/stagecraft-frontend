import { NextRequest } from 'next/server'

function normalizeHost(host: string) {
  if (host.startsWith('0.0.0.0')) {
    return host.replace('0.0.0.0', 'localhost')
  }

  if (host.startsWith('[::]')) {
    return host.replace('[::]', 'localhost')
  }

  return host
}

export function getRequestOrigin(request: NextRequest) {
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = normalizeHost(
    forwardedHost || request.headers.get('host') || request.nextUrl.host,
  )
  const proto = forwardedProto || request.nextUrl.protocol.replace(':', '')

  return `${proto}://${host}`
}


export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export const WS_URL = (() => {
  const base = API_URL.replace(/^http/, 'ws')
  return `${base}/ws`
})()

export const AUTH_COOKIE_NAME = 'stagecraft_token'

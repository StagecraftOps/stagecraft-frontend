/**
 * Centralised runtime config for the frontend.
 *
 * Import from here — never reference process.env.NEXT_PUBLIC_* directly in
 * components. This makes it easy to find every place the API URL is used and
 * ensures the fallback lives in exactly one place.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export const WS_URL = (() => {
  const base = API_URL.replace(/^http/, 'ws')
  return `${base}/ws`
})()

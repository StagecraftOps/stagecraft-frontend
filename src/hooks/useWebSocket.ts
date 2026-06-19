'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { WebSocketEvent } from '@/types'
import { WS_URL } from '@/lib/config'

interface UseWebSocketOptions {
  onMessage: (event: WebSocketEvent) => void
  enabled?: boolean
}
const MAX_RECONNECT_DELAY = 30_000
const INITIAL_RECONNECT_DELAY = 1_000

export function useWebSocket({ onMessage, enabled = true }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY)
  const onMessageRef = useRef(onMessage)
  const mountedRef = useRef(true)

  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    if (!mountedRef.current || !enabled) return

    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) return
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY
      }

      ws.onmessage = (event) => {
        if (!mountedRef.current) return
        try {
          const parsed = JSON.parse(event.data) as WebSocketEvent
          onMessageRef.current(parsed)
        } catch {
        }
      }

      ws.onclose = () => {
        if (!mountedRef.current) return
        wsRef.current = null
        scheduleReconnect()
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch {
      scheduleReconnect()
    }
  }, [enabled])

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)

    reconnectTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        reconnectDelayRef.current = Math.min(
          reconnectDelayRef.current * 2,
          MAX_RECONNECT_DELAY
        )
        connect()
      }
    }, reconnectDelayRef.current)
  }, [connect])

  useEffect(() => {
    mountedRef.current = true

    if (enabled) {
      connect()
    }

    return () => {
      mountedRef.current = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [enabled, connect])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  return { disconnect }
}

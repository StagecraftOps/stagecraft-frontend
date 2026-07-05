'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchOrgs } from '@/lib/api'
import type { Organization } from '@/types'

const STORAGE_KEY = 'stagecraft.currentOrg'

interface OrgContextValue {
  orgs: Organization[]
  currentOrg: string
  setOrg: (login: string) => void
  isLoading: boolean
}

const OrgContext = createContext<OrgContextValue | null>(null)

/**
 * Single source of truth for the selected organization, shared across every
 * dashboard page. Seeds from the ['orgs'] query, remembers the choice in
 * localStorage, and falls back to the first org. Replaces the per-page
 * useState + useEffect + <select> that was duplicated across ~8 pages.
 */
export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { data: orgs = [], isLoading } = useQuery({ queryKey: ['orgs'], queryFn: fetchOrgs })
  const [selected, setSelected] = useState('')

  // Restore persisted choice on mount (client only).
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    if (saved) setSelected(saved)
  }, [])

  // Once orgs load, ensure the selection is valid (or default to the first).
  useEffect(() => {
    if (orgs.length === 0) return
    const valid = orgs.some((o) => o.login === selected)
    if (!valid) setSelected(orgs[0].login)
  }, [orgs, selected])

  const setOrg = (login: string) => {
    setSelected(login)
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, login)
  }

  const currentOrg = orgs.some((o) => o.login === selected) ? selected : orgs[0]?.login || ''

  const value = useMemo<OrgContextValue>(
    () => ({ orgs, currentOrg, setOrg, isLoading }),
    [orgs, currentOrg, isLoading],
  )

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error('useOrg must be used within an OrgProvider')
  return ctx
}

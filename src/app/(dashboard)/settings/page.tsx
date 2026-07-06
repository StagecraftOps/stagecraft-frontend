'use client'

import { AlertCircle, ExternalLink, Github, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchOrgs, removeOrg, getOrgInstallUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { API_URL } from '@/lib/config'

export default function SettingsPage() {
  const queryClient = useQueryClient()

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['orgs'],
    queryFn: fetchOrgs,
  })

  const removeMutation = useMutation({
    mutationFn: (login: string) => removeOrg(login),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgs'] })
    },
  })

  const handleInstall = () => {
    
    window.location.href = getOrgInstallUrl()
  }

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader
        title="Settings"
        description="Manage your connected GitHub organizations."
      />

      <Card>
        <CardHeader>
          <CardTitle>Connected Organizations</CardTitle>
          <CardDescription>
            Organizations tracked by Stagecraft via the Stagecraft GitHub App.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-12 bg-zinc-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : orgs.length === 0 ? (
            <div className="flex items-center gap-3 py-6 text-center justify-center text-zinc-400">
              <AlertCircle size={16} />
              <p className="text-sm">No organizations connected yet.</p>
            </div>
          ) : (
            <div className="space-y-2 mb-5">
              {orgs.map((org) => (
                <div
                  key={org.login}
                  className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-100 rounded-lg"
                >
                  {org.avatar_url && (
                    
                    <img
                      src={org.avatar_url}
                      alt={org.login}
                      width={28}
                      height={28}
                      className="rounded-full"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-800 truncate">
                      {org.name || org.login}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">@{org.login}</p>
                  </div>
                  <a
                    href={`https://github.com/${org.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    <ExternalLink size={13} />
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-zinc-400 hover:text-rose-500 h-7 w-7"
                    onClick={() => removeMutation.mutate(org.login)}
                    disabled={removeMutation.isPending}
                    title="Remove organization"
                    aria-label={`Remove ${org.login}`}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-zinc-100">
            <p className="text-xs text-zinc-500 mb-3">
              To connect a new organization, install the Stagecraft GitHub App on it.
              Once installed, it will appear here automatically.
            </p>
            <Button variant="primary" onClick={handleInstall} className="flex items-center gap-2">
              <Github size={15} />
              Install GitHub App
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

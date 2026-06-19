'use client'

import { useState } from 'react'
import { Plus, Trash2, AlertCircle, CheckCircle2, Copy, ExternalLink } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchOrgs, addOrg, removeOrg } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { API_URL } from '@/lib/config'

const WEBHOOK_URL = `${API_URL}/api/v1/webhooks/github`

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [newOrg, setNewOrg] = useState('')
  const [addError, setAddError] = useState('')
  const [copiedWebhook, setCopiedWebhook] = useState(false)

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['orgs'],
    queryFn: fetchOrgs,
  })

  const addMutation = useMutation({
    mutationFn: (login: string) => addOrg(login),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgs'] })
      setNewOrg('')
      setAddError('')
    },
    onError: (err: Error) => {
      setAddError(err.message || 'Failed to add organization.')
    },
  })

  const removeMutation = useMutation({
    mutationFn: (login: string) => removeOrg(login),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgs'] })
    },
  })

  const handleAddOrg = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrg.trim()) return
    addMutation.mutate(newOrg.trim())
  }

  const handleCopyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(WEBHOOK_URL)
      setCopiedWebhook(true)
      setTimeout(() => setCopiedWebhook(false), 2000)
    } catch {
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-800">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage your organizations and webhook configuration.
        </p>
      </div>

      {/* Connected Organizations */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connected Organizations</CardTitle>
          <CardDescription>
            Add or remove GitHub organizations tracked by PipelineIQ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Org list */}
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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

          {/* Add org form */}
          <form onSubmit={handleAddOrg} className="mt-4">
            <label className="block text-xs font-medium text-zinc-600 mb-2">
              Add Organization
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newOrg}
                onChange={(e) => setNewOrg(e.target.value)}
                placeholder="e.g. my-github-org"
                className="flex-1 text-sm border border-zinc-200 rounded-md px-3 py-2 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={!newOrg.trim() || addMutation.isPending}
              >
                <Plus size={15} />
                {addMutation.isPending ? 'Adding...' : 'Add'}
              </Button>
            </div>
            {addError && (
              <p className="mt-2 text-xs text-rose-600 flex items-center gap-1.5">
                <AlertCircle size={12} />
                {addError}
              </p>
            )}
            {addMutation.isSuccess && (
              <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 size={12} />
                Organization added successfully.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Webhook Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>
            Add this webhook to your GitHub organization to receive real-time
            pipeline events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-2">
                Webhook URL
              </label>
              <div className="flex gap-2">
                <code className="flex-1 text-xs font-mono bg-zinc-900 text-emerald-400 px-4 py-3 rounded-lg overflow-x-auto">
                  {WEBHOOK_URL}
                </code>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleCopyWebhook}
                  title="Copy webhook URL"
                  aria-label="Copy webhook URL"
                  className="flex-shrink-0"
                >
                  {copiedWebhook ? (
                    <CheckCircle2 size={15} className="text-emerald-500" />
                  ) : (
                    <Copy size={15} />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-2">
                Content Type
              </label>
              <code className="inline-block text-xs font-mono bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded">
                application/json
              </code>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-2">
                Events to subscribe
              </label>
              <div className="flex flex-wrap gap-2">
                {['workflow_run', 'workflow_job', 'push'].map((event) => (
                  <code
                    key={event}
                    className="text-xs font-mono bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded"
                  >
                    {event}
                  </code>
                ))}
              </div>
            </div>

            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
              <h4 className="text-xs font-semibold text-zinc-700 mb-2">
                How to configure
              </h4>
              <ol className="text-xs text-zinc-500 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>
                  Go to your GitHub organization settings → Webhooks → Add webhook
                </li>
                <li>Paste the Webhook URL above into the Payload URL field</li>
                <li>
                  Set Content type to <code className="font-mono">application/json</code>
                </li>
                <li>
                  Under &quot;Which events&quot; select{' '}
                  <strong>Workflow runs</strong> and <strong>Workflow jobs</strong>
                </li>
                <li>Click &quot;Add webhook&quot; to save</li>
              </ol>
            </div>

            <a
              href="https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              GitHub Webhook Documentation
              <ExternalLink size={11} />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

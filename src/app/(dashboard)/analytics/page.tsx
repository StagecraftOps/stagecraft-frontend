'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { TrendingUp, Bot, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { StatsCard } from '@/components/dashboard/stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonCard } from '@/components/ui/skeleton'

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ color: string; name: string; value: number }>
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-zinc-700 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-zinc-500 capitalize">{entry.name}:</span>
          <span className="font-semibold text-zinc-800">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '—'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  if (m < 60) return s ? `${m}m ${s}s` : `${m}m`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m`
}

export default function AnalyticsPage() {
  const { data: analytics, isLoading, error } = useAnalytics()

  // Success/failure as a share of COMPLETED runs (excludes still-running and
  // cancelled/skipped), so the three shares actually add up and read honestly.
  const completed = analytics?.completed_runs ?? 0
  const successPct = completed ? (analytics!.success_count / completed) * 100 : 0
  const failurePct = completed ? (analytics!.failure_count / completed) * 100 : 0
  const otherPct = completed ? (analytics!.other_count / completed) * 100 : 0

  const successRateDisplay = analytics && completed ? `${successPct.toFixed(1)}%` : '—'
  const failureRateDisplay = analytics && completed ? `${failurePct.toFixed(1)}%` : '—'

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-800">Analytics</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Pipeline performance metrics and AI remediation insights.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
          <AlertCircle size={16} />
          <p className="text-sm">Failed to load analytics data.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatsCard
              title="Total Runs"
              value={analytics?.total_runs ?? 0}
              icon={TrendingUp}
            />
            <StatsCard
              title="Success Rate"
              value={successRateDisplay}
              icon={CheckCircle2}
              iconClassName="bg-emerald-50"
            />
            <StatsCard
              title="Failure Rate"
              value={failureRateDisplay}
              icon={AlertCircle}
              iconClassName="bg-rose-50"
            />
            <StatsCard
              title="AI PRs Raised"
              value={analytics?.remediations_raised ?? 0}
              icon={Bot}
              iconClassName="bg-amber-50"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Run trend line chart */}
        <Card>
          <CardHeader>
            <CardTitle>Run Trend — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-full h-full bg-zinc-50 rounded animate-pulse" />
              </div>
            ) : !analytics?.run_trend || analytics.run_trend.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-zinc-400 text-sm">
                No trend data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={analytics.run_trend}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e4e4e7' }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v)
                      return `${d.getMonth() + 1}/${d.getDate()}`
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="success"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Success"
                  />
                  <Line
                    type="monotone"
                    dataKey="failed"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={false}
                    name="Failed"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top failing repos bar chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Failing Repositories</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 bg-zinc-50 rounded animate-pulse" />
            ) : !analytics?.top_failing_repos ||
              analytics.top_failing_repos.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-zinc-400 text-sm">
                <div className="text-center">
                  <CheckCircle2 size={32} className="text-emerald-300 mx-auto mb-3" />
                  <p>No failing repos. Great work!</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={analytics.top_failing_repos}
                  layout="vertical"
                  margin={{ top: 4, right: 20, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#f4f4f5"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e4e4e7' }}
                  />
                  <YAxis
                    dataKey="repo"
                    type="category"
                    width={100}
                    tick={{ fontSize: 11, fill: '#52525b' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) =>
                      v.length > 16 ? v.slice(0, 16) + '…' : v
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    fill="#f59e0b"
                    radius={[0, 4, 4, 0]}
                    name="Failures"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Run outcome breakdown — honest 3-way split of completed runs */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Run Outcomes ({completed.toLocaleString()} completed)</CardTitle>
        </CardHeader>
        <CardContent>
          {completed === 0 ? (
            <p className="text-sm text-zinc-400 py-2">No completed runs yet.</p>
          ) : (
            <>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-100">
                <div className="bg-emerald-500" style={{ width: `${successPct}%` }} />
                <div className="bg-rose-500" style={{ width: `${failurePct}%` }} />
                <div className="bg-zinc-300" style={{ width: `${otherPct}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-6 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Success {successPct.toFixed(1)}% ({analytics?.success_count ?? 0})</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" />Failure {failurePct.toFixed(1)}% ({analytics?.failure_count ?? 0})</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-zinc-300" />Other {otherPct.toFixed(1)}% ({analytics?.other_count ?? 0})</span>
              </div>
              <p className="mt-2 text-[11px] text-zinc-400">&ldquo;Other&rdquo; = cancelled, skipped, timed-out or startup-failure runs.</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* AI remediation timing — real, computed metrics */}
      <Card>
        <CardHeader>
          <CardTitle>AI Remediation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8 py-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-zinc-800 tabular-nums">
                {analytics?.remediations_raised ?? 0}
              </p>
              <p className="text-xs text-zinc-500 mt-1">PRs raised</p>
            </div>
            <div className="w-px h-12 bg-zinc-100" />
            <div className="text-center">
              <p className="text-3xl font-bold text-zinc-800 tabular-nums">
                {formatDuration(analytics?.avg_analysis_seconds)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Avg. time to fix suggestion</p>
            </div>
            <div className="w-px h-12 bg-zinc-100" />
            <div className="text-center">
              <p className="text-3xl font-bold text-zinc-800 tabular-nums">
                {formatDuration(analytics?.avg_time_to_pr_seconds)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Avg. time to PR</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

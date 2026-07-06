import { Component, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { LucideAngularModule, TrendingUp, Bot, CheckCircle2, AlertCircle } from 'lucide-angular'
import { PageHeaderComponent } from '../shared/page-header.component'
import { LineChartComponent } from '../shared/line-chart.component'
import { BarChartComponent, BarDatum } from '../shared/bar-chart.component'
import { ApiService } from '../core/api.service'
import type { AnalyticsData } from '../core/types'

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '—'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  if (m < 60) return s ? `${m}m ${s}s` : `${m}m`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m`
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, PageHeaderComponent, LineChartComponent, BarChartComponent],
  templateUrl: './analytics.component.html',
})
export class AnalyticsComponent implements OnInit {
  icons = { TrendingUp, Bot, CheckCircle2, AlertCircle }
  formatDuration = formatDuration

  analytics = signal<AnalyticsData | null>(null)
  isLoading = signal(true)
  error = signal(false)

  constructor(private api: ApiService) {}

  async ngOnInit() {
    try {
      this.analytics.set(await this.api.fetchAnalytics())
    } catch {
      this.error.set(true)
    } finally {
      this.isLoading.set(false)
    }
  }

  completed(): number {
    return this.analytics()?.completed_runs ?? 0
  }

  successPct(): number {
    const a = this.analytics()
    return a && this.completed() ? (a.success_count / this.completed()) * 100 : 0
  }

  failurePct(): number {
    const a = this.analytics()
    return a && this.completed() ? (a.failure_count / this.completed()) * 100 : 0
  }

  otherPct(): number {
    const a = this.analytics()
    return a && this.completed() ? (a.other_count / this.completed()) * 100 : 0
  }

  topFailingBars(): BarDatum[] {
    return (this.analytics()?.top_failing_repos ?? []).map((r) => ({ label: r.repo, value: r.count }))
  }
}

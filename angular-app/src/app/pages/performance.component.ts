import { Component, effect, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { LucideAngularModule, AlertTriangle } from 'lucide-angular'
import { PageHeaderComponent } from '../shared/page-header.component'
import { BarChartComponent, BarDatum } from '../shared/bar-chart.component'
import { ApiService } from '../core/api.service'
import { OrgService } from '../core/org.service'
import type { LongestJobEntry, LongestWorkflowEntry, RunnerBreakdownEntry } from '../core/types'

function formatDuration(seconds: number): string {
  const total = Math.round(seconds)
  if (total < 60) return `${total}s`
  const m = Math.floor(total / 60)
  return `${m}m ${total % 60}s`
}

@Component({
  selector: 'app-performance',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, PageHeaderComponent, BarChartComponent],
  templateUrl: './performance.component.html',
})
export class PerformanceComponent {
  icons = { AlertTriangle }
  formatDuration = formatDuration

  longestJobs = signal<LongestJobEntry[]>([])
  longestWorkflows = signal<LongestWorkflowEntry[]>([])
  runnerBreakdown = signal<RunnerBreakdownEntry[]>([])
  isLoading = signal(true)

  constructor(public org: OrgService, private api: ApiService) {
    effect(() => {
      if (this.org.currentOrg()) queueMicrotask(() => this.load())
    })
  }

  async load() {
    this.isLoading.set(true)
    try {
      const [jobs, workflows, runners] = await Promise.all([
        this.api.fetchLongestJobs(this.org.currentOrg()),
        this.api.fetchLongestWorkflows(this.org.currentOrg()),
        this.api.fetchRunnerBreakdown(this.org.currentOrg()),
      ])
      this.longestJobs.set(jobs)
      this.longestWorkflows.set(workflows)
      this.runnerBreakdown.set(runners)
    } finally {
      this.isLoading.set(false)
    }
  }

  jobBars(): BarDatum[] {
    return this.longestJobs().map((j) => ({ label: j.job_name, value: j.duration_seconds }))
  }

  totalJobs(): number {
    return this.runnerBreakdown().reduce((sum, r) => sum + r.job_count, 0)
  }

  runnerPct(count: number): number {
    return this.totalJobs() ? (100 * count) / this.totalJobs() : 0
  }

  hasUnassigned(): boolean {
    return this.runnerBreakdown().some((r) => !r.runner_labels || r.runner_labels.length === 0)
  }
}

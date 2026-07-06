import { Component, effect, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { LucideAngularModule, GitBranch, Activity, XCircle, Bot, AlertCircle, ExternalLink } from 'lucide-angular'
import { PageHeaderComponent } from '../shared/page-header.component'
import { BadgeComponent } from '../shared/badge.component'
import { RunRowComponent } from '../shared/run-row.component'
import { ApiService } from '../core/api.service'
import { OrgService } from '../core/org.service'
import { truncate, formatRelativeTime } from '../core/utils'
import type { WorkflowRun, Remediation, User } from '../core/types'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, PageHeaderComponent, BadgeComponent, RunRowComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  icons = { GitBranch, Activity, XCircle, Bot, AlertCircle, ExternalLink }
  truncate = truncate
  formatRelativeTime = formatRelativeTime

  user = signal<User | null>(null)
  workflows = signal<{ length: number }>({ length: 0 })
  recentRuns = signal<WorkflowRun[]>([])
  remediations = signal<Remediation[]>([])
  isLoading = signal(true)

  constructor(public org: OrgService, private api: ApiService) {
    effect(() => {
      if (this.org.currentOrg()) queueMicrotask(() => this.load())
    })
    this.api.fetchCurrentUser().then((u) => this.user.set(u)).catch(() => {})
  }

  async load() {
    this.isLoading.set(true)
    try {
      const [workflows, runsPage, remediations] = await Promise.all([
        this.api.fetchWorkflowsByOrg(this.org.currentOrg()),
        this.api.fetchRuns({ limit: 10 }),
        this.api.fetchRemediations(),
      ])
      this.workflows.set({ length: workflows.length })
      this.recentRuns.set(runsPage.runs)
      this.remediations.set(remediations)
    } finally {
      this.isLoading.set(false)
    }
  }

  greeting(): string {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  activeRuns(): number {
    return this.recentRuns().filter((r) => r.status === 'in_progress').length
  }

  failedToday(): number {
    const now = new Date()
    return this.remediations().filter((r) => {
      const d = new Date(r.created_at)
      return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth() && d.getUTCDate() === now.getUTCDate()
    }).length
  }

  aiFixesRaised(): number {
    return this.remediations().filter((r) => r.status === 'pr_raised' && r.pr_url).length
  }

  recentRemediations(): Remediation[] {
    return this.remediations().slice(0, 3)
  }
}

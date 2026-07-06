import { Component, computed, effect, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { LucideAngularModule, RefreshCw, Clock, CheckCircle2, XCircle } from 'lucide-angular'
import { PageHeaderComponent } from '../shared/page-header.component'
import { BadgeComponent } from '../shared/badge.component'
import { ApiService } from '../core/api.service'
import { OrgService } from '../core/org.service'
import type { Workflow, OptimizationRecommendation } from '../core/types'

function formatDuration(seconds: number): string {
  const sign = seconds < 0 ? '-' : ''
  const abs = Math.abs(seconds)
  if (abs < 60) return `${sign}${abs}s`
  return `${sign}${Math.floor(abs / 60)}m ${abs % 60}s`
}

@Component({
  selector: 'app-optimization',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PageHeaderComponent, BadgeComponent],
  templateUrl: './optimization.component.html',
})
export class OptimizationComponent {
  icons = { RefreshCw, Clock, CheckCircle2, XCircle }
  formatDuration = formatDuration

  workflows = signal<Workflow[]>([])
  selectedRepo = signal('')
  selectedWorkflow = signal('')
  recommendations = signal<OptimizationRecommendation[]>([])
  analyzing = signal(false)

  repos = computed(() => Array.from(new Set(this.workflows().map((w) => w.repo_name))).sort())
  repoWorkflows = computed(() => this.workflows().filter((w) => w.repo_name === this.selectedRepo()))

  constructor(public org: OrgService, private api: ApiService) {
    effect(() => {
      if (this.org.currentOrg()) this.init()
    })
  }

  async init() {
    const workflows = await this.api.fetchWorkflowsByOrg(this.org.currentOrg())
    this.workflows.set(workflows)
    const repos = Array.from(new Set(workflows.map((w) => w.repo_name))).sort()
    if (repos.length > 0 && !this.selectedRepo()) this.selectedRepo.set(repos[0])
    const repoWfs = workflows.filter((w) => w.repo_name === this.selectedRepo())
    if (repoWfs.length > 0 && !this.selectedWorkflow()) this.selectedWorkflow.set(repoWfs[0].path)
    await this.loadRecommendations()
  }

  onRepoChange(repo: string) {
    this.selectedRepo.set(repo)
    this.selectedWorkflow.set('')
    const repoWfs = this.workflows().filter((w) => w.repo_name === repo)
    if (repoWfs.length > 0) this.selectedWorkflow.set(repoWfs[0].path)
    this.loadRecommendations()
  }

  async loadRecommendations() {
    if (!this.selectedRepo()) return
    this.recommendations.set(await this.api.fetchOptimizationRecommendations(this.org.currentOrg(), this.selectedRepo()))
  }

  async analyze() {
    this.analyzing.set(true)
    try {
      await this.api.analyzeOptimization(this.org.currentOrg(), this.selectedRepo(), this.selectedWorkflow())
      await this.loadRecommendations()
    } finally {
      this.analyzing.set(false)
    }
  }

  async accept(id: string) {
    await this.api.acceptRecommendation(id)
    await this.loadRecommendations()
  }

  async reject(id: string) {
    await this.api.rejectRecommendation(id)
    await this.loadRecommendations()
  }
}

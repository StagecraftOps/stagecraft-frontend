import { Component, OnInit, signal, computed } from '@angular/core'
import { CommonModule } from '@angular/common'
import { LucideAngularModule, Bug, ExternalLink, AlertCircle, GitPullRequest, CircleAlert, Network } from 'lucide-angular'
import { PageHeaderComponent } from '../shared/page-header.component'
import { ApiService } from '../core/api.service'
import { OrgService } from '../core/org.service'
import { formatRelativeTime } from '../core/utils'
import type { VulnerabilityFinding } from '../core/types'

function severityClasses(sev: string | null): string {
  switch (sev) {
    case 'critical': return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20'
    case 'high': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20'
    case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20'
    default: return 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700'
  }
}

function sourceLabel(source: string): string {
  switch (source) {
    case 'code_scanning': return 'Code Scanning'
    case 'dependabot': return 'Dependabot'
    case 'secret_scanning': return 'Secret Scanning'
    default: return source
  }
}

@Component({
  selector: 'app-vulnerabilities',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, PageHeaderComponent],
  template: `
    <div class="p-8">
      <app-page-header eyebrow="Security" title="Vulnerability Remediation" description="Findings from CodeQL, Dependabot, and any SARIF-uploading scanner (Trivy, Grype, Semgrep), triaged and de-duplicated by the Vulnerability Agent -- StageCraft governs on top of these tools, it doesn't replace them."></app-page-header>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div class="bg-white border border-zinc-200 rounded-lg p-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div class="text-2xl font-semibold text-zinc-800 tabular-nums dark:text-zinc-100">{{ findings().length }}</div>
          <div class="text-xs uppercase tracking-wider text-zinc-400 mt-1">Open findings</div>
        </div>
        <div class="bg-white border border-zinc-200 rounded-lg p-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div class="text-2xl font-semibold text-rose-600 tabular-nums">{{ criticalCount() }}</div>
          <div class="text-xs uppercase tracking-wider text-zinc-400 mt-1">Critical</div>
        </div>
        <div class="bg-white border border-zinc-200 rounded-lg p-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div class="text-2xl font-semibold text-emerald-600 tabular-nums">{{ prsRaisedCount() }}</div>
          <div class="text-xs uppercase tracking-wider text-zinc-400 mt-1">Fix PRs raised</div>
        </div>
        <div class="bg-white border border-zinc-200 rounded-lg p-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div class="text-2xl font-semibold text-zinc-800 tabular-nums dark:text-zinc-100">{{ noFixCount() }}</div>
          <div class="text-xs uppercase tracking-wider text-zinc-400 mt-1">Needs manual fix</div>
        </div>
      </div>

      <div *ngIf="error()" class="flex items-center gap-3 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
        <lucide-angular [img]="icons.AlertCircle" [size]="16"></lucide-angular>
        <p class="text-sm">Failed to load vulnerability findings. Check your connection.</p>
      </div>

      <div *ngIf="!isLoading() && findings().length === 0" class="flex flex-col items-center justify-center py-16 text-center bg-white border border-zinc-200 rounded-lg dark:bg-zinc-900 dark:border-zinc-800">
        <lucide-angular [img]="icons.Bug" [size]="24" class="text-zinc-300 mb-2"></lucide-angular>
        <p class="text-sm text-zinc-400">No vulnerability findings tracked yet. They appear here when CodeQL, Dependabot, or an uploaded SARIF scan raises an alert.</p>
      </div>

      <div class="flex flex-col gap-2">
        <div *ngFor="let f of findings()" class="bg-white border border-zinc-200 rounded-lg p-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 dark:bg-rose-500/10">
              <lucide-angular [img]="icons.Bug" [size]="16"></lucide-angular>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <span class="font-semibold text-zinc-800 dark:text-zinc-100">{{ f.package_name || f.identifier || 'Finding' }}</span>
                <span class="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border" [ngClass]="severityClasses(f.severity_in_context)">{{ f.severity_in_context || 'unknown' }}</span>
                <span class="text-xs text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-50 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700">{{ sourceLabel(f.alert_source) }}</span>
                <span class="text-xs text-zinc-400 ml-auto">{{ f.repo_name }} · {{ formatRelativeTime(f.updated_at) }}</span>
              </div>
              <p class="text-sm text-zinc-600 dark:text-zinc-300 mb-2">{{ f.rca_summary || f.description || 'No summary available.' }}</p>

              <div class="flex items-center gap-4 flex-wrap text-xs text-zinc-400">
                <span *ngIf="f.blast_radius?.affected_repos as repos" class="inline-flex items-center gap-1">
                  <lucide-angular [img]="icons.Network" [size]="12"></lucide-angular>
                  {{ repos.length }} repo{{ repos.length !== 1 ? 's' : '' }} affected
                </span>
                <span class="inline-flex items-center gap-1" [class.text-emerald-600]="f.status === 'pr_raised'">
                  <lucide-angular [img]="icons.GitPullRequest" [size]="12"></lucide-angular>
                  {{ f.status === 'pr_raised' ? 'Fix PR raised' : f.fix_available ? 'Fix available' : 'No automated fix' }}
                </span>
                <a *ngIf="f.pr_url" [href]="f.pr_url" target="_blank" rel="noopener noreferrer" class="text-amber-600 hover:text-amber-700 font-medium">View PR</a>
                <a *ngIf="f.github_issue_url" [href]="f.github_issue_url" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 hover:text-amber-600 transition-colors">
                  Issue #{{ f.github_issue_number }} <lucide-angular [img]="icons.ExternalLink" [size]="11"></lucide-angular>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class VulnerabilitiesComponent implements OnInit {
  icons = { Bug, ExternalLink, AlertCircle, GitPullRequest, CircleAlert, Network }
  formatRelativeTime = formatRelativeTime
  severityClasses = severityClasses
  sourceLabel = sourceLabel

  findings = signal<VulnerabilityFinding[]>([])
  isLoading = signal(true)
  error = signal(false)

  criticalCount = computed(() => this.findings().filter(f => f.severity_in_context === 'critical').length)
  prsRaisedCount = computed(() => this.findings().filter(f => f.status === 'pr_raised').length)
  noFixCount = computed(() => this.findings().filter(f => !f.fix_available).length)

  constructor(private api: ApiService, private org: OrgService) {}

  async ngOnInit() {
    try {
      const data = await this.api.fetchVulnerabilityFindings(this.org.currentOrg())
      this.findings.set(data.findings)
    } catch {
      this.error.set(true)
    } finally {
      this.isLoading.set(false)
    }
  }
}

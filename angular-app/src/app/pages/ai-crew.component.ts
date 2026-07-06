import { Component, OnInit, signal, computed } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { LucideAngularModule, Wrench, GitPullRequest, ShieldCheck, FileText, Gauge, GitCompare, ShieldAlert, Bug, ClipboardCheck, AlertCircle, Bot, ArrowUpRight } from 'lucide-angular'
import { PageHeaderComponent } from '../shared/page-header.component'
import { ApiService } from '../core/api.service'
import { OrgService } from '../core/org.service'
import { formatRelativeTime } from '../core/utils'
import type { AgentSummary } from '../core/types'

interface AgentMeta {
  key: string
  label: string
  blurb: string
  icon: any
  category: string
  live: boolean
  href?: string
}

const ROSTER: AgentMeta[] = [
  { key: 'failure_rca', label: 'Self-Healing RCA', blurb: 'Classifies pipeline failures and proposes a fix PR.', icon: Wrench, category: 'Remediation', live: true, href: '/remediation' },
  { key: 'peer_review', label: 'Peer Review', blurb: 'Reviews PRs for removed gates, secrets, broad permissions.', icon: GitPullRequest, category: 'Review', live: true, href: '/pr-reviews' },
  { key: 'compliance', label: 'Compliance', blurb: 'Audits workflows against HIPAA / PCI / SOC2 controls.', icon: ShieldCheck, category: 'Quality', live: true, href: '/governance' },
  { key: 'governance', label: 'Governance', blurb: 'Compares pipelines to your uploaded policy documents.', icon: FileText, category: 'Quality', live: true, href: '/governance' },
  { key: 'performance_optimization', label: 'Performance Tuner', blurb: 'Finds parallelization and bottleneck fixes, drafts YAML.', icon: Gauge, category: 'Optimization', live: true, href: '/optimization' },
  { key: 'drift_detector', label: 'Drift Detector', blurb: 'Flags live pipelines drifting from approved templates.', icon: GitCompare, category: 'Governance', live: true },
  { key: 'compliance_watchdog', label: 'Compliance Watchdog', blurb: 'Continuous control checks; opens PRs for missing stages.', icon: ShieldAlert, category: 'Governance', live: false },
  { key: 'vulnerability_remediation', label: 'Vulnerability Agent', blurb: 'Turns CodeQL / Dependabot / secret-scanning alerts into tracked fixes.', icon: Bug, category: 'Security', live: true, href: '/vulnerabilities' },
  { key: 'audit_evidence', label: 'Audit Evidence', blurb: 'Traverses the graph to build signed compliance reports.', icon: ClipboardCheck, category: 'Compliance', live: false },
]

@Component({
  selector: 'app-ai-crew',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, PageHeaderComponent],
  template: `
    <div class="p-8">
      <app-page-header eyebrow="AI Crew" title="Agent Fleet" description="Every StageCraft agent, what it governs, and what it has done across your organization."></app-page-header>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div class="bg-white border border-zinc-200 rounded-lg p-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div class="text-2xl font-semibold text-zinc-800 tabular-nums dark:text-zinc-100">{{ liveCount() }}</div>
          <div class="text-xs uppercase tracking-wider text-zinc-400 mt-1">Live agents</div>
        </div>
        <div class="bg-white border border-zinc-200 rounded-lg p-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div class="text-2xl font-semibold text-zinc-800 tabular-nums dark:text-zinc-100">{{ plannedCount() }}</div>
          <div class="text-xs uppercase tracking-wider text-zinc-400 mt-1">Planned</div>
        </div>
        <div class="bg-white border border-zinc-200 rounded-lg p-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div class="text-2xl font-semibold text-zinc-800 tabular-nums dark:text-zinc-100">{{ totalRuns() }}</div>
          <div class="text-xs uppercase tracking-wider text-zinc-400 mt-1">Total runs</div>
        </div>
        <div class="bg-white border border-zinc-200 rounded-lg p-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div class="text-2xl font-semibold text-amber-600 tabular-nums">{{ totalGaps() }}</div>
          <div class="text-xs uppercase tracking-wider text-zinc-400 mt-1">Gaps found</div>
        </div>
      </div>

      <div *ngIf="error()" class="flex items-center gap-3 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
        <lucide-angular [img]="icons.AlertCircle" [size]="16"></lucide-angular>
        <p class="text-sm">Failed to load agent activity. Check your connection.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div *ngFor="let a of roster" class="bg-white border border-zinc-200 rounded-lg p-5 flex flex-col dark:bg-zinc-900 dark:border-zinc-800">
          <div class="flex items-start gap-3 mb-3">
            <div class="w-9 h-9 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 dark:bg-amber-500/10">
              <lucide-angular [img]="a.icon" [size]="18"></lucide-angular>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-zinc-800 truncate dark:text-zinc-100">{{ a.label }}</span>
                <span *ngIf="a.live" class="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">Live</span>
                <span *ngIf="!a.live" class="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700">Planned</span>
              </div>
              <div class="text-xs text-zinc-400 mt-0.5">{{ a.category }}</div>
            </div>
          </div>

          <p class="text-sm text-zinc-500 leading-snug flex-1 dark:text-zinc-400">{{ a.blurb }}</p>

          <div class="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div>
              <div class="text-sm font-semibold text-zinc-700 tabular-nums dark:text-zinc-200">{{ stat(a.key).total_runs }}</div>
              <div class="text-[10px] uppercase tracking-wider text-zinc-400">Runs</div>
            </div>
            <div>
              <div class="text-sm font-semibold text-zinc-700 tabular-nums dark:text-zinc-200">{{ stat(a.key).gaps_found }}</div>
              <div class="text-[10px] uppercase tracking-wider text-zinc-400">Gaps</div>
            </div>
            <div>
              <div class="text-sm font-semibold text-zinc-700 tabular-nums dark:text-zinc-200">{{ stat(a.key).prs_opened }}</div>
              <div class="text-[10px] uppercase tracking-wider text-zinc-400">PRs</div>
            </div>
          </div>

          <div class="flex items-center justify-between mt-3">
            <span class="text-xs text-zinc-400">
              {{ stat(a.key).last_run_at ? ('Last run ' + formatRelativeTime(stat(a.key).last_run_at!)) : (a.live ? 'No runs yet' : 'Not deployed') }}
            </span>
            <a *ngIf="a.href" [routerLink]="a.href" class="text-xs text-amber-600 hover:text-amber-700 inline-flex items-center gap-1 font-medium">
              Open <lucide-angular [img]="icons.ArrowUpRight" [size]="12"></lucide-angular>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AiCrewComponent implements OnInit {
  icons = { AlertCircle, Bot, ArrowUpRight }
  roster = ROSTER
  formatRelativeTime = formatRelativeTime

  summaries = signal<Record<string, AgentSummary>>({})
  error = signal(false)

  liveCount = computed(() => ROSTER.filter(a => a.live).length)
  plannedCount = computed(() => ROSTER.filter(a => !a.live).length)
  totalRuns = computed(() => Object.values(this.summaries()).reduce((s, a) => s + a.total_runs, 0))
  totalGaps = computed(() => Object.values(this.summaries()).reduce((s, a) => s + a.gaps_found, 0))

  constructor(private api: ApiService, private org: OrgService) {}

  async ngOnInit() {
    try {
      const data = await this.api.fetchAgentFleetSummary(this.org.currentOrg())
      const map: Record<string, AgentSummary> = {}
      for (const a of data.agents) map[a.agent_name] = a
      this.summaries.set(map)
    } catch {
      this.error.set(true)
    }
  }

  stat(key: string): AgentSummary {
    return this.summaries()[key] ?? { agent_name: key, total_runs: 0, last_run_at: null, last_outcome: null, gaps_found: 0, prs_opened: 0, failure_runs: 0 }
  }
}

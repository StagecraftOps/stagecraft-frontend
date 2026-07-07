import { Component, OnInit, signal, computed } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { LucideAngularModule, Bug, ExternalLink, AlertCircle, GitPullRequest, CircleAlert, Network, Boxes, Rocket, Send, Settings, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-angular'
import { PageHeaderComponent } from '../shared/page-header.component'
import { ApiService } from '../core/api.service'
import { OrgService } from '../core/org.service'
import { ApplicationService } from '../core/application.service'
import { formatRelativeTime } from '../core/utils'
import type { VulnerabilityFinding, SkillFile } from '../core/types'

const AGENT_KEY = 'vulnerability_remediation'

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
  imports: [CommonModule, FormsModule, LucideAngularModule, PageHeaderComponent],
  template: `
    <div class="p-8">
      <app-page-header eyebrow="Security · System Agent" title="Vulnerability RCA" description="Findings from Trivy, Sonar, CodeQL and Dependabot — root-caused, severity-escalated by application context, and de-duplicated into tracked issues. StageCraft governs on top of these scanners, it doesn't replace them."></app-page-header>

      <!-- Scope filters -->
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <div class="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <lucide-angular [img]="icons.Boxes" [size]="15" class="text-amber-500"></lucide-angular>
          Application:
          <span class="font-medium text-zinc-700 dark:text-zinc-200">{{ appSvc.currentApplication()?.name || 'All applications' }}</span>
          <span class="text-xs text-zinc-400">(switch in the sidebar)</span>
        </div>
        <div class="inline-flex items-center gap-2">
          <label class="text-sm text-zinc-500 dark:text-zinc-400">Repository:</label>
          <select [ngModel]="repoFilter()" (ngModelChange)="repoFilter.set($event)"
            class="text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option value="">All repositories</option>
            <option *ngFor="let r of distinctRepos()" [value]="r">{{ r }}</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div class="bg-white border border-zinc-200 rounded-lg p-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div class="text-2xl font-semibold text-zinc-800 tabular-nums dark:text-zinc-100">{{ visibleFindings().length }}</div>
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

      <div *ngIf="!isLoading() && visibleFindings().length === 0" class="flex flex-col items-center justify-center py-16 text-center bg-white border border-zinc-200 rounded-lg dark:bg-zinc-900 dark:border-zinc-800">
        <lucide-angular [img]="icons.Bug" [size]="24" class="text-zinc-300 mb-2"></lucide-angular>
        <p class="text-sm text-zinc-400">No vulnerability findings in this scope yet. They appear here when Trivy, Sonar, CodeQL, or Dependabot raises an alert.</p>
      </div>

      <!-- Vulnerability Remediation: Custom agent -->
      <div id="remediation-agent" class="bg-white border-2 border-sky-200 rounded-lg p-5 mb-6 dark:bg-zinc-900 dark:border-sky-500/30 scroll-mt-6">
        <div class="flex items-center gap-2 mb-1">
          <lucide-angular [img]="icons.Send" [size]="15" class="text-sky-600"></lucide-angular>
          <h3 class="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Vulnerability Remediation <span class="text-xs font-normal text-zinc-400">· Custom agent</span></h3>
        </div>
        <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          Publishes scanning into a repo, or raises a fix PR for the most foundational vulnerable dependency first
          when several open findings depend on each other (checked against the real npm/PyPI registries).
        </p>
        <div class="flex flex-wrap items-end gap-3">
          <div>
            <label class="block text-xs text-zinc-500 mb-1">Repository</label>
            <select [ngModel]="remediationRepo()" (ngModelChange)="remediationRepo.set($event)"
              class="text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-[220px]">
              <option value="">Select a repo…</option>
              <option *ngFor="let r of remediationRepoOptions()" [value]="r">{{ r }}</option>
            </select>
          </div>
          <button (click)="publishAgent()" [disabled]="!remediationRepo() || publishing()"
            class="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors">
            <lucide-angular [img]="icons.Rocket" [size]="14"></lucide-angular>
            {{ publishing() ? 'Publishing…' : 'Publish to repo' }}
          </button>
          <button (click)="runDependencyFix()" [disabled]="!remediationRepo() || running()"
            class="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors">
            <lucide-angular [img]="icons.Send" [size]="14"></lucide-angular>
            {{ running() ? 'Running…' : 'Run dependency-ordered fix' }}
          </button>
        </div>
        <p *ngIf="remediationMessage()" class="text-xs text-zinc-500 dark:text-zinc-400 mt-3">{{ remediationMessage() }}</p>

        <!-- Agent configuration: system prompt + skill files -->
        <div class="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button (click)="toggleConfig()" class="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
            <lucide-angular [img]="icons.Settings" [size]="13"></lucide-angular>
            Agent configuration (system prompt &amp; skill files)
            <lucide-angular [img]="configOpen() ? icons.ChevronUp : icons.ChevronDown" [size]="13"></lucide-angular>
          </button>

          <div *ngIf="configOpen()" class="mt-3 space-y-4">
            <div *ngIf="configLoading()" class="h-20 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg animate-pulse"></div>

            <ng-container *ngIf="!configLoading()">
              <div>
                <label class="block text-xs font-medium text-zinc-500 mb-1">System prompt</label>
                <textarea [ngModel]="systemPrompt()" (ngModelChange)="systemPrompt.set($event)" rows="4"
                  placeholder="e.g. Never auto-fix packages under services/legacy/. Prefer minor version bumps over major."
                  class="w-full text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"></textarea>
                <p class="text-[11px] text-zinc-400 mt-1">Prepended to the agent's own instructions before every fix decision.</p>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-medium text-zinc-500">Skill files</label>
                  <button (click)="addSkillFile()" class="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline">
                    <lucide-angular [img]="icons.Plus" [size]="12"></lucide-angular> Add file
                  </button>
                </div>
                <div *ngFor="let f of skillFiles(); let i = index" class="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 mb-2">
                  <div class="flex items-center gap-2 mb-2">
                    <input [ngModel]="f.name" (ngModelChange)="updateSkillFileName(i, $event)" placeholder="filename.md"
                      class="flex-1 text-xs font-mono border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    <button (click)="removeSkillFile(i)" class="text-zinc-400 hover:text-rose-500">
                      <lucide-angular [img]="icons.Trash2" [size]="13"></lucide-angular>
                    </button>
                  </div>
                  <textarea [ngModel]="f.content" (ngModelChange)="updateSkillFileContent(i, $event)" rows="3"
                    placeholder="Instructions/constraints for this skill…"
                    class="w-full text-xs border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"></textarea>
                </div>
                <p *ngIf="skillFiles().length === 0" class="text-xs text-zinc-400">No skill files yet.</p>
              </div>

              <button (click)="saveConfig()" [disabled]="savingConfig()"
                class="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md bg-zinc-800 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white disabled:opacity-50 transition-colors">
                {{ savingConfig() ? 'Saving…' : 'Save configuration' }}
              </button>
              <p *ngIf="configMessage()" class="text-xs text-zinc-500 dark:text-zinc-400">{{ configMessage() }}</p>
            </ng-container>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <div *ngFor="let f of visibleFindings()" class="bg-white border border-zinc-200 rounded-lg p-4 dark:bg-zinc-900 dark:border-zinc-800">
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
  icons = { Bug, ExternalLink, AlertCircle, GitPullRequest, CircleAlert, Network, Boxes, Rocket, Send, Settings, Plus, Trash2, ChevronDown, ChevronUp }
  formatRelativeTime = formatRelativeTime
  severityClasses = severityClasses
  sourceLabel = sourceLabel

  findings = signal<VulnerabilityFinding[]>([])
  isLoading = signal(true)
  error = signal(false)
  repoFilter = signal<string>('')

  remediationRepo = signal<string>('')
  publishing = signal(false)
  running = signal(false)
  remediationMessage = signal<string | null>(null)

  configOpen = signal(false)
  configLoading = signal(false)
  savingConfig = signal(false)
  configMessage = signal<string | null>(null)
  systemPrompt = signal<string>('')
  skillFiles = signal<SkillFile[]>([])
  private configLoaded = false

  distinctRepos = computed(() =>
    Array.from(new Set(this.findings().map((f) => f.repo_name))).sort(),
  )
  visibleFindings = computed(() => {
    const repo = this.repoFilter()
    return repo ? this.findings().filter((f) => f.repo_name === repo) : this.findings()
  })
  remediationRepoOptions = computed(() => {
    const appRepos = this.appSvc.currentApplication()?.repo_names
    return appRepos && appRepos.length ? appRepos : this.distinctRepos()
  })

  criticalCount = computed(() => this.visibleFindings().filter(f => f.severity_in_context === 'critical').length)
  prsRaisedCount = computed(() => this.visibleFindings().filter(f => f.status === 'pr_raised').length)
  noFixCount = computed(() => this.visibleFindings().filter(f => !f.fix_available).length)

  constructor(private api: ApiService, private org: OrgService, public appSvc: ApplicationService) {}

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

  async publishAgent() {
    const repo = this.remediationRepo()
    if (!repo) return
    this.publishing.set(true)
    this.remediationMessage.set(null)
    try {
      await this.api.publishVulnerabilityAgent(this.org.currentOrg(), repo)
      this.remediationMessage.set(`Publish requested for ${repo} — check GitHub for the PR shortly.`)
    } catch {
      this.remediationMessage.set('Failed to enqueue publish. Try again.')
    } finally {
      this.publishing.set(false)
    }
  }

  async runDependencyFix() {
    const repo = this.remediationRepo()
    if (!repo) return
    this.running.set(true)
    this.remediationMessage.set(null)
    try {
      await this.api.runVulnerabilityDependencyFix(this.org.currentOrg(), repo)
      this.remediationMessage.set(`Dependency-ordered fix requested for ${repo} — check back here or on GitHub shortly.`)
    } catch {
      this.remediationMessage.set('Failed to enqueue dependency fix. Try again.')
    } finally {
      this.running.set(false)
    }
  }

  async toggleConfig() {
    this.configOpen.set(!this.configOpen())
    if (this.configOpen() && !this.configLoaded) {
      this.configLoading.set(true)
      try {
        const config = await this.api.fetchCustomAgentConfig(this.org.currentOrg(), AGENT_KEY)
        this.systemPrompt.set(config.system_prompt || '')
        this.skillFiles.set(config.skill_files || [])
        this.configLoaded = true
      } catch {
        this.configMessage.set('Failed to load agent configuration.')
      } finally {
        this.configLoading.set(false)
      }
    }
  }

  addSkillFile() {
    this.skillFiles.set([...this.skillFiles(), { name: '', content: '' }])
  }

  removeSkillFile(index: number) {
    this.skillFiles.set(this.skillFiles().filter((_, i) => i !== index))
  }

  updateSkillFileName(index: number, name: string) {
    this.skillFiles.set(this.skillFiles().map((f, i) => (i === index ? { ...f, name } : f)))
  }

  updateSkillFileContent(index: number, content: string) {
    this.skillFiles.set(this.skillFiles().map((f, i) => (i === index ? { ...f, content } : f)))
  }

  async saveConfig() {
    this.savingConfig.set(true)
    this.configMessage.set(null)
    try {
      await this.api.saveCustomAgentConfig(this.org.currentOrg(), AGENT_KEY, this.systemPrompt() || null, this.skillFiles())
      this.configMessage.set('Saved. Applies to the next fix/publish run.')
    } catch {
      this.configMessage.set('Failed to save. Try again.')
    } finally {
      this.savingConfig.set(false)
    }
  }
}

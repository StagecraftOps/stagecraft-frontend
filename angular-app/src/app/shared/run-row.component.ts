import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { LucideAngularModule, GitBranch, ExternalLink } from 'lucide-angular'
import { BadgeComponent } from './badge.component'
import { formatRelativeTime, calculateDuration, formatSha, truncate } from '../core/utils'
import type { WorkflowRun } from '../core/types'

@Component({
  selector: 'app-run-row',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, BadgeComponent],
  template: `
    <tr (click)="goto()" class="hover:bg-zinc-50 transition-colors cursor-pointer">
      <td *ngIf="showWorkflow" class="py-3 px-4 text-sm truncate">
        <span class="font-medium text-zinc-800">{{ truncate(run.workflow_name || ('Run #' + run.github_run_id), 40) }}</span>
      </td>
      <td *ngIf="showRepo" class="py-3 px-4 text-sm text-zinc-500 truncate">{{ run.repo_name || '—' }}</td>
      <td class="py-3 px-4 whitespace-nowrap overflow-hidden">
        <span class="inline-flex items-center gap-1 text-xs text-zinc-500 max-w-full">
          <lucide-angular [img]="icons.GitBranch" [size]="11" class="text-zinc-400 flex-shrink-0"></lucide-angular>
          <span class="truncate">{{ run.branch }}</span>
        </span>
      </td>
      <td class="py-3 px-4 whitespace-nowrap">
        <code class="text-xs text-zinc-400 font-mono bg-zinc-50 px-1.5 py-0.5 rounded">{{ formatSha(run.head_sha) }}</code>
      </td>
      <td class="py-3 px-4 whitespace-nowrap">
        <app-badge [status]="displayStatus()"></app-badge>
      </td>
      <td class="py-3 px-4 text-xs text-zinc-500 tabular-nums whitespace-nowrap">
        {{ run.started_at ? calculateDuration(run.started_at, run.completed_at) : '—' }}
      </td>
      <td class="py-3 px-4 text-xs text-zinc-400 whitespace-nowrap">
        {{ run.started_at ? formatRelativeTime(run.started_at) : '—' }}
      </td>
      <td class="py-3 px-4 whitespace-nowrap">
        <a *ngIf="run.html_url" [href]="run.html_url" target="_blank" rel="noopener noreferrer" (click)="$event.stopPropagation()" class="text-zinc-400 hover:text-amber-600 transition-colors">
          <lucide-angular [img]="icons.ExternalLink" [size]="13"></lucide-angular>
        </a>
      </td>
    </tr>
  `,
})
export class RunRowComponent {
  @Input({ required: true }) run!: WorkflowRun
  @Input() showWorkflow = true
  @Input() showRepo = true

  icons = { GitBranch, ExternalLink }
  truncate = truncate
  formatSha = formatSha
  calculateDuration = calculateDuration
  formatRelativeTime = formatRelativeTime

  constructor(private router: Router) {}

  displayStatus(): string {
    return this.run.status === 'completed' ? this.run.conclusion || 'neutral' : this.run.status
  }

  goto() {
    this.router.navigate(['/runs', this.run.id])
  }
}

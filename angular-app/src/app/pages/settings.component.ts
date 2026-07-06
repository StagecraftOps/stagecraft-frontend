import { Component, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { LucideAngularModule, AlertCircle, ExternalLink, Github, Trash2 } from 'lucide-angular'
import { PageHeaderComponent } from '../shared/page-header.component'
import { ApiService } from '../core/api.service'
import type { Organization } from '../core/types'

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, PageHeaderComponent],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  icons = { AlertCircle, ExternalLink, Github, Trash2 }
  orgs = signal<Organization[]>([])
  isLoading = signal(true)
  removingLogin = signal<string | null>(null)

  constructor(private api: ApiService) {}

  async ngOnInit() {
    await this.load()
  }

  async load() {
    this.isLoading.set(true)
    try {
      this.orgs.set(await this.api.fetchOrgs())
    } finally {
      this.isLoading.set(false)
    }
  }

  async remove(login: string) {
    this.removingLogin.set(login)
    try {
      await this.api.removeOrg(login)
      await this.load()
    } finally {
      this.removingLogin.set(null)
    }
  }

  install() {
    window.location.href = this.api.getOrgInstallUrl()
  }
}

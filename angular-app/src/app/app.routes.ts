import { Routes } from '@angular/router'
import { DashboardShellComponent } from './layout/dashboard-shell.component'
import { SettingsComponent } from './pages/settings.component'
import { RunsComponent } from './pages/runs.component'
import { WorkflowsComponent } from './pages/workflows.component'
import { DashboardComponent } from './pages/dashboard.component'
import { ComingSoonComponent } from './pages/coming-soon.component'

export const routes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'runs', component: RunsComponent },
      { path: 'workflows', component: WorkflowsComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'analytics', component: ComingSoonComponent, data: { pageTitle: 'Analytics' } },
      { path: 'performance', component: ComingSoonComponent, data: { pageTitle: 'Performance' } },
      { path: 'dependency-graph', component: ComingSoonComponent, data: { pageTitle: 'Dependency Graph' } },
      { path: 'remediation', component: ComingSoonComponent, data: { pageTitle: 'Remediation' } },
      { path: 'pr-reviews', component: ComingSoonComponent, data: { pageTitle: 'Peer Review' } },
      { path: 'chat', component: ComingSoonComponent, data: { pageTitle: 'Pipeline Chat' } },
      { path: 'governance', component: ComingSoonComponent, data: { pageTitle: 'Governance' } },
      { path: 'standardization', component: ComingSoonComponent, data: { pageTitle: 'Standardization' } },
      { path: 'optimization', component: ComingSoonComponent, data: { pageTitle: 'Optimization' } },
      { path: 'knowledge-graph', component: ComingSoonComponent, data: { pageTitle: 'Knowledge Graph' } },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
]

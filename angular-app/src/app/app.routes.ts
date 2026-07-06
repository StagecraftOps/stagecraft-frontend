import { Routes } from '@angular/router'
import { DashboardShellComponent } from './layout/dashboard-shell.component'
import { LandingComponent } from './landing/landing.component'
import { AuthCallbackComponent } from './core/auth-callback.component'
import { authGuard } from './core/auth.guard'
import { SettingsComponent } from './pages/settings.component'
import { RunsComponent } from './pages/runs.component'
import { WorkflowsComponent } from './pages/workflows.component'
import { DashboardComponent } from './pages/dashboard.component'
import { AnalyticsComponent } from './pages/analytics.component'
import { PerformanceComponent } from './pages/performance.component'
import { RemediationListComponent } from './pages/remediation-list.component'
import { RemediationDetailComponent } from './pages/remediation-detail.component'
import { PrReviewsComponent } from './pages/pr-reviews.component'
import { GovernanceComponent } from './pages/governance.component'
import { StandardizationComponent } from './pages/standardization.component'
import { OptimizationComponent } from './pages/optimization.component'
import { ChatComponent } from './pages/chat.component'
import { RunDetailComponent } from './pages/run-detail.component'
import { WorkflowRepoDetailComponent } from './pages/workflow-repo-detail.component'
import { DependencyGraphComponent } from './pages/dependency-graph.component'
import { KnowledgeGraphComponent } from './pages/knowledge-graph.component'
import { AiCrewComponent } from './pages/ai-crew.component'
import { AuditComponent } from './pages/audit.component'
import { VulnerabilitiesComponent } from './pages/vulnerabilities.component'

export const routes: Routes = [
  { path: 'api/auth/callback', component: AuthCallbackComponent },
  { path: '', component: LandingComponent, pathMatch: 'full' },
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'runs', component: RunsComponent },
      { path: 'runs/:run_id', component: RunDetailComponent },
      { path: 'workflows', component: WorkflowsComponent },
      { path: 'workflows/:owner/:repo', component: WorkflowRepoDetailComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'analytics', component: AnalyticsComponent },
      { path: 'performance', component: PerformanceComponent },
      { path: 'dependency-graph', component: DependencyGraphComponent },
      { path: 'ai-crew', component: AiCrewComponent },
      { path: 'audit', component: AuditComponent },
      { path: 'vulnerabilities', component: VulnerabilitiesComponent },
      { path: 'remediation', component: RemediationListComponent },
      { path: 'remediation/:id', component: RemediationDetailComponent },
      { path: 'pr-reviews', component: PrReviewsComponent },
      { path: 'chat', component: ChatComponent },
      { path: 'governance', component: GovernanceComponent },
      { path: 'standardization', component: StandardizationComponent },
      { path: 'optimization', component: OptimizationComponent },
      { path: 'knowledge-graph', component: KnowledgeGraphComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
]

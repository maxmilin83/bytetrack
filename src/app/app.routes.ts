import { Routes } from '@angular/router';
import { routes as tabsRoutes } from './pages/tabs/tabs.routes';

export const routes: Routes = [
  {
    path: 'welcome',
    loadComponent: () => import('./pages/welcome/welcome.page').then(m => m.WelcomePage)
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./pages/onboarding/onboarding.page').then(m => m.OnboardingPage)
  },
  {
    path: '',
    children: tabsRoutes
  },
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full'
  }
];
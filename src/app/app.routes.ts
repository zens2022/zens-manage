import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/assets/asset-page.component').then(m => m.AssetPageComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];

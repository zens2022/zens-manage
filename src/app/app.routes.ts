import { Routes } from '@angular/router';
import { AssetPageComponent } from './features/assets/asset-page.component';

export const routes: Routes = [
  {
    path: '',
    component: AssetPageComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];

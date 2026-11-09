import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./chat/chat').then((m) => m.Chat),
    title: 'AI Workbench',
  },
  { path: '**', redirectTo: '' },
];

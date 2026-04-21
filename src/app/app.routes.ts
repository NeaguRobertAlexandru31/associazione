import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
	{ path: '', redirectTo: 'home', pathMatch: 'full' },
	{ path: 'home', loadComponent: () => import('./features/public/home/home').then(m => m.Home) },
	{ path: 'about-us', loadComponent: () => import('./features/public/about-us/about-us').then(m => m.AboutUs) },
	{ path: 'projects', loadComponent: () => import('./features/public/projects/projects').then(m => m.Projects) },
	{ path: 'news', loadComponent: () => import('./features/public/news/news').then(m => m.News) },
	{ path: 'events', loadComponent: () => import('./features/public/events/events').then(m => m.Events) },
	{ path: 'donations', loadComponent: () => import('./features/public/donations/donations').then(m => m.Donations) },
	{ path: 'contacts', loadComponent: () => import('./features/public/contacts/contacts').then(m => m.Contacts) },
	{ path: 'documents', loadComponent: () => import('./features/public/documents/documents').then(m => m.Documents) },
	{ path: 'membership', loadComponent: () => import('./features/public/membership/membership').then(m => m.Membership) },
	{ path: 'boutique', loadComponent: () => import('./features/public/boutique/boutique').then(m => m.Boutique) },
	// ── Auth & private ────────────────────────────────────────────────────
	{ path: 'login',
	  loadComponent: () => import('./features/private/auth/auth').then(m => m.Auth) },
	{ path: 'dashboard',
	  canActivate: [authGuard],
	  loadComponent: () => import('./features/private/dashboard/dashboard').then(m => m.Dashboard) },

	{ path: '**', redirectTo: 'home' },
];

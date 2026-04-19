import { Routes } from '@angular/router';

export const routes: Routes = [
	{ path: '', redirectTo: 'home', pathMatch: 'full' },
	{ path: 'home', loadComponent: () => import('./features/home/home').then(m => m.Home) },
	{ path: 'about-us', loadComponent: () => import('./features/about-us/about-us').then(m => m.AboutUs) },
	{ path: 'projects', loadComponent: () => import('./features/projects/projects').then(m => m.Projects) },
	{ path: 'news', loadComponent: () => import('./features/news/news').then(m => m.News) },
	{ path: 'events', loadComponent: () => import('./features/events/events').then(m => m.Events) },
	{ path: 'donations', loadComponent: () => import('./features/donations/donations').then(m => m.Donations) },
	{ path: 'contacts', loadComponent: () => import('./features/contacts/contacts').then(m => m.Contacts) },
	{ path: 'documents', loadComponent: () => import('./features/documents/documents').then(m => m.Documents) },
	{ path: 'membership', loadComponent: () => import('./features/membership/membership').then(m => m.Membership) },
	{ path: 'boutique', loadComponent: () => import('./features/boutique/boutique').then(m => m.Boutique) },
	{ path: '**', redirectTo: 'home' },
];

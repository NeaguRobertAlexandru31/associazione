import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
	{ path: '', redirectTo: 'home', pathMatch: 'full' },
	{ path: 'home', 			loadComponent: () => import('./features/public/home/home').then(m => m.Home) },
	{ path: 'about-us', 		loadComponent: () => import('./features/public/about-us/about-us').then(m => m.AboutUs) },
	{ path: 'projects', 		loadComponent: () => import('./features/public/projects/projects').then(m => m.Projects) },
	{ path: 'projects/:id', 	loadComponent: () => import('./features/public/projects/project-detail/project-detail').then(m => m.ProjectDetail) },
	{ path: 'news', 			loadComponent: () => import('./features/public/news/news').then(m => m.News) },
	{ path: 'news/:id', 		loadComponent: () => import('./features/public/news/news-detail/news-detail').then(m => m.NewsDetail) },
	{ path: 'events', 			loadComponent: () => import('./features/public/events/events').then(m => m.Events) },
	{ path: 'events/:slug', 	loadComponent: () => import('./features/public/events/event-detail/event-detail').then(m => m.EventDetail) },
	{ path: 'donations', 		loadComponent: () => import('./features/public/donations/donations').then(m => m.Donations) },
	{ path: 'contacts', 		loadComponent: () => import('./features/public/contacts/contacts').then(m => m.Contacts) },
	{ path: 'documents', 		loadComponent: () => import('./features/public/documents/documents').then(m => m.Documents) },
	{ path: 'membership', 		loadComponent: () => import('./features/public/membership/membership').then(m => m.Membership) },
	{ path: 'boutique', 		loadComponent: () => import('./features/public/boutique/boutique').then(m => m.Boutique) },
	{ path: 'tessera-preview', 	loadComponent: () => import('./features/public/tessera-preview/tessera-preview').then(m => m.TesseraPreview) },
	{ path: 'unisciti', 		loadComponent: () => import('./features/public/register/register').then(m => m.Register) },
	// ── Auth ──────────────────────────────────────────────────────────────
	{ path: 'login', 			loadComponent: () => import('./features/private/auth/auth').then(m => m.Auth) },
	{ path: 'register', 		redirectTo: 'login' },
	{ path: 'area-socio',       loadComponent: () => import('./features/private/personal/personal').then(m => m.Personal) },
	// ── Dashboard (shell + children) ──────────────────────────────────────
	{
		path: 'dashboard',
		canActivate: [authGuard],
		loadComponent: () => import('./features/private/dashboard/dashboard').then(m => m.Dashboard),
		children: [
			{ path: '', redirectTo: 'overview', pathMatch: 'full' },
			{ path: 'overview',      canActivate: [roleGuard('overview')],     loadComponent: () => import('./features/private/overview/overview').then(m => m.Overview) },
			{ path: 'members',       canActivate: [roleGuard('members')],      loadComponent: () => import('./features/private/members/members').then(m => m.Members) },
			{ path: 'members/:id',   canActivate: [roleGuard('members')],      loadComponent: () => import('./features/private/members/members-detail/members-detail').then(m => m.MembersDetail) },
			{ path: 'events',        canActivate: [roleGuard('events')],       loadComponent: () => import('./features/private/events/events').then(m => m.Events) },
			{ path: 'messages',      canActivate: [roleGuard('messages')],     loadComponent: () => import('./features/private/messagges/messagges').then(m => m.Messagges) },
			{ path: 'news',          canActivate: [roleGuard('news')],         loadComponent: () => import('./features/private/news/news').then(m => m.News) },
			{ path: 'projects',      canActivate: [roleGuard('projects')],     loadComponent: () => import('./features/private/projects/projects').then(m => m.Projects) },
			{ path: 'donations',     canActivate: [roleGuard('donations')],    loadComponent: () => import('./features/private/donations/donations').then(m => m.Donations) },
			{ path: 'settings',      canActivate: [roleGuard('settings')],     loadComponent: () => import('./features/private/settings/settings').then(m => m.Settings) },
			{ path: 'activities',    canActivate: [roleGuard('activities')],   loadComponent: () => import('./features/private/activities/activities').then(m => m.Activities) },
			{ path: 'permissions',   canActivate: [roleGuard('permissions')],  loadComponent: () => import('./features/private/permissions/permissions').then(m => m.Permissions) },
		],
	},
	{ path: '**', redirectTo: 'home' },
];

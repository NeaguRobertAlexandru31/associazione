import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Sidebar, SidebarItem } from '../../../shared/components/private/sidebar/sidebar';
import { PrivateNavbar } from '../../../shared/components/private/navbar/navbar';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, Sidebar, PrivateNavbar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private auth   = inject(AuthService);
  private router = inject(Router);

  readonly user        = this.auth.user;
  activeTab    = signal('overview');
  sidebarOpen  = signal(false);

  readonly navItems: SidebarItem[] = [
    { id: 'overview',  icon: 'dashboard',          label: 'Panoramica'  },
    { id: 'members',   icon: 'group',               label: 'Soci'        },
    { id: 'events',    icon: 'calendar_month',      label: 'Calendario'  },
    { id: 'content',   icon: 'article',             label: 'Contenuti'   },
    { id: 'donations', icon: 'volunteer_activism',  label: 'Donazioni'   },
    { id: 'settings',  icon: 'settings',            label: 'Impostazioni'},
  ];

  readonly stats = [
    { icon: 'group',             label: 'Soci Attivi',         value: '512',    delta: '+14 questo mese',        positive: true  },
    { icon: 'calendar_month',    label: 'Eventi in Programma', value: '6',      delta: '3 nelle prossime 2 sett.', positive: true },
    { icon: 'volunteer_activism',label: 'Donazioni (Apr)',      value: '€1.840', delta: '+22% vs marzo',           positive: true  },
    { icon: 'newspaper',         label: 'Articoli Pubblicati', value: '9',      delta: '2 bozze in attesa',       positive: false },
  ];

  readonly activity = [
    { icon: 'person_add',          text: 'Nuovo socio: Maria Ionescu',               time: '2h fa',  color: 'text-primary'            },
    { icon: 'event',               text: 'Evento "Sânziene" aggiornato',             time: '5h fa',  color: 'text-secondary'          },
    { icon: 'volunteer_activism',  text: 'Donazione €50 da Ion Popescu',             time: 'Ieri',   color: 'text-primary'            },
    { icon: 'article',             text: 'Articolo pubblicato: Borsa di Studio 2024', time: 'Ieri',  color: 'text-on-surface-variant'  },
    { icon: 'person_add',          text: 'Nuovo socio: Alexandru Dumitrescu',        time: '2gg fa', color: 'text-primary'            },
  ];

  get activeLabel(): string {
    return this.navItems.find(i => i.id === this.activeTab())?.label ?? 'A.C.R.';
  }

  setTab(id: string): void { this.activeTab.set(id); this.sidebarOpen.set(false); }

  logout(): void { this.auth.logout(); this.router.navigate(['/login']); }
}

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth';
import { DirettivoMember, MembersResponse, SocioMember } from '../../../core/models/member.model';
import { MembersService } from '../../../core/services/members/members';
import { MetricCard } from '../../../shared/components/private/metric-card/metric-card';
import { Sidebar, SidebarItem } from '../../../shared/components/private/sidebar/sidebar';
import { PrivateNavbar } from '../../../shared/components/private/navbar/navbar';

@Component({
  selector: 'app-dashboard',
  imports: [Sidebar, PrivateNavbar, MetricCard],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private auth    = inject(AuthService);
  private router  = inject(Router);
  private membersService = inject(MembersService);

  readonly user         = this.auth.user;
  readonly isSuperAdmin = this.auth.isSuperAdmin;
  activeTab     = signal('overview');
  sidebarOpen   = signal(false);
  inviteLink    = signal<string | null>(null);
  inviteLoading = signal(false);
  copied        = signal(false);

  direttivo      = signal<DirettivoMember[]>([]);
  soci           = signal<SocioMember[]>([]);
  membersLoading = signal(false);
  membersError   = signal(false);

  readonly stats = computed(() => [
    {
      icon: 'group',
      label: 'Soci Attivi',
      value: this.membersLoading() ? '—' : String(this.soci().length),
      delta: `di cui ${this.direttivo().length} nel direttivo`,
      positive: true,
      loading: this.membersLoading(),
    },
    { icon: 'calendar_month',    label: 'Eventi in Programma', value: '6',      delta: '3 nelle prossime 2 sett.', positive: true,  loading: false },
    { icon: 'volunteer_activism',label: 'Donazioni (Apr)',      value: '€1.840', delta: '+22% vs marzo',            positive: true,  loading: false },
    { icon: 'newspaper',         label: 'Articoli Pubblicati', value: '9',      delta: '2 bozze in attesa',        positive: false, loading: false },
  ]);

  readonly navItems: SidebarItem[] = [
    { id: 'overview',  icon: 'dashboard',          label: 'Panoramica'  },
    { id: 'members',   icon: 'group',               label: 'Soci'        },
    { id: 'events',    icon: 'calendar_month',      label: 'Calendario'  },
    { id: 'content',   icon: 'article',             label: 'Contenuti'   },
    { id: 'donations', icon: 'volunteer_activism',  label: 'Donazioni'   },
    { id: 'settings',  icon: 'settings',            label: 'Impostazioni'},
  ];

  readonly activity = [
    { icon: 'person_add',          text: 'Nuovo socio: Maria Ionescu',                time: '2h fa',  color: 'text-primary'           },
    { icon: 'event',               text: 'Evento "Sânziene" aggiornato',              time: '5h fa',  color: 'text-secondary'         },
    { icon: 'volunteer_activism',  text: 'Donazione €50 da Ion Popescu',              time: 'Ieri',   color: 'text-primary'           },
    { icon: 'article',             text: 'Articolo pubblicato: Borsa di Studio 2024', time: 'Ieri',   color: 'text-on-surface-variant' },
    { icon: 'person_add',          text: 'Nuovo socio: Alexandru Dumitrescu',         time: '2gg fa', color: 'text-primary'           },
  ];

  get activeLabel(): string {
    return this.navItems.find(i => i.id === this.activeTab())?.label ?? 'A.C.R.';
  }

  ngOnInit(): void {
    this.loadMembers();
  }

  setTab(id: string): void {
    this.activeTab.set(id);
    this.sidebarOpen.set(false);
  }

  private loadMembers(): void {
    this.membersLoading.set(true);
    this.membersError.set(false);
    this.membersService.getAll().subscribe({
      next: (res: MembersResponse) => {
        this.direttivo.set(res.direttivo);
        this.soci.set(res.soci);
        this.membersLoading.set(false);
      },
      error: () => {
        this.membersError.set(true);
        this.membersLoading.set(false);
      },
    });
  }

  logout(): void { this.auth.logout(); this.router.navigate(['/login']); }

  generateInvite(): void {
    this.inviteLoading.set(true);
    this.inviteLink.set(null);
    this.copied.set(false);
    this.auth.createInvite().subscribe({
      next: (res) => {
        const link = `${window.location.origin}/register?token=${res.token}`;
        this.inviteLink.set(link);
        this.inviteLoading.set(false);
      },
      error: () => this.inviteLoading.set(false),
    });
  }

  copyLink(): void {
    const link = this.inviteLink();
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    });
  }
}

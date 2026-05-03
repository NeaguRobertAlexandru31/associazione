import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DirettivoMember, MembersResponse, SocioMember } from '../../../core/models/member.model';
import { MembersService } from '../../../core/services/members/members';
import { MetricCard } from '../../../shared/components/private/metric-card/metric-card';
import { Recents } from '../../../shared/components/private/recents/recents';

@Component({
  selector: 'app-overview',
  imports: [MetricCard, Recents, RouterLink],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
})
export class Overview implements OnInit {
  private membersService = inject(MembersService);

  direttivo      = signal<DirettivoMember[]>([]);
  soci           = signal<SocioMember[]>([]);
  membersLoading = signal(true);

  readonly stats = computed(() => [
    {
      icon: 'group',
      label: 'Soci Attivi',
      value: this.membersLoading() ? '—' : String(this.soci().length),
      delta: `di cui ${this.direttivo().length} nel direttivo`,
      positive: true,
      loading: this.membersLoading(),
    },
    { icon: 'calendar_month',     label: 'Eventi in Programma', value: '6',      delta: '3 nelle prossime 2 sett.', positive: true,  loading: false },
    { icon: 'volunteer_activism', label: 'Donazioni (Apr)',      value: '€1.840', delta: '+22% vs marzo',            positive: true,  loading: false },
    { icon: 'newspaper',          label: 'Articoli Pubblicati', value: '9',      delta: '2 bozze in attesa',        positive: false, loading: false },
  ]);

  readonly quickLinks = [
    { route: '/dashboard/members',   icon: 'group',              label: 'Soci'        },
    { route: '/dashboard/events',    icon: 'calendar_month',     label: 'Calendario'  },
    { route: '/dashboard/messages',  icon: 'mail',               label: 'Messaggi'    },
    { route: '/dashboard/news',      icon: 'article',            label: 'Contenuti'   },
    { route: '/dashboard/donations', icon: 'volunteer_activism', label: 'Donazioni'   },
    { route: '/dashboard/settings',  icon: 'settings',           label: 'Impostazioni'},
  ];

  ngOnInit(): void {
    this.membersService.getAll().subscribe({
      next: (res: MembersResponse) => {
        this.direttivo.set(res.direttivo);
        this.soci.set(res.soci);
        this.membersLoading.set(false);
      },
      error: () => this.membersLoading.set(false),
    });
  }
}

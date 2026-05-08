import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DirettivoMember, MembersResponse, SocioMember } from '../../../core/models/member.model';
import { CalendarEvent } from '../../../core/models/event.model';
import { Article } from '../../../core/models/article.model';
import { DonationStats, MembersService } from '../../../core/services/members/members';
import { EventsService } from '../../../core/services/events/events';
import { ArticlesService } from '../../../core/services/articles/articles';
import { MetricCard } from '../../../shared/components/private/metric-card/metric-card';
import { Recents } from '../../../shared/components/private/recents/recents';

@Component({
  selector: 'app-overview',
  imports: [MetricCard, Recents, RouterLink],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
})
export class Overview implements OnInit {
  private membersService  = inject(MembersService);
  private eventsService   = inject(EventsService);
  private articlesService = inject(ArticlesService);

  direttivo     = signal<DirettivoMember[]>([]);
  soci          = signal<SocioMember[]>([]);
  events        = signal<CalendarEvent[]>([]);
  articles      = signal<Article[]>([]);
  donationStats = signal<DonationStats>({ count: 0, total: 0, thisMonthCount: 0, thisMonthTotal: 0 });
  loading       = signal(true);

  readonly upcomingCount = computed(() => {
    const now = new Date();
    return this.events().filter(e => new Date(e.date) >= now).length;
  });

  readonly sociAttiviCount = computed(() =>
    this.soci().filter(s => s.status === 'attivo').length
  );

  readonly sociInAttesaCount = computed(() =>
    this.soci().filter(s => s.status === 'in_attesa_pagamento').length
  );

  readonly articlesThisMonth = computed(() => {
    const start = new Date();
    start.setDate(1); start.setHours(0, 0, 0, 0);
    return this.articles().filter(a => new Date(a.createdAt) >= start).length;
  });

  private fmt(n: number): string {
    return n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  }

  readonly stats = computed(() => [
    {
      icon: 'group',
      label: 'Soci Attivi',
      value: this.loading() ? '—' : String(this.sociAttiviCount()),
      delta: `di cui ${this.direttivo().length} nel direttivo · ${this.sociInAttesaCount()} in attesa`,
      positive: true,
      loading: this.loading(),
    },
    {
      icon: 'calendar_month',
      label: 'Eventi in Programma',
      value: this.loading() ? '—' : String(this.upcomingCount()),
      delta: `${this.events().length} totali`,
      positive: true,
      loading: this.loading(),
    },
    {
      icon: 'newspaper',
      label: 'Articoli Pubblicati',
      value: this.loading() ? '—' : String(this.articles().length),
      delta: `${this.articlesThisMonth()} questo mese`,
      positive: true,
      loading: this.loading(),
    },
    {
      icon: 'volunteer_activism',
      label: 'Donazioni Ricevute',
      value: this.loading() ? '—' : this.fmt(this.donationStats().total),
      delta: `${this.donationStats().count} totali · ${this.fmt(this.donationStats().thisMonthTotal)} questo mese`,
      positive: true,
      loading: this.loading(),
    },
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
    forkJoin({
      members:       this.membersService.getAll(),
      events:        this.eventsService.getAll(),
      articles:      this.articlesService.getAll(),
      donationStats: this.membersService.getDonationStats(),
    }).subscribe({
      next: ({ members, events, articles, donationStats }) => {
        this.direttivo.set((members as MembersResponse).direttivo);
        this.soci.set((members as MembersResponse).soci);
        this.events.set(events);
        this.articles.set(articles);
        this.donationStats.set(donationStats);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

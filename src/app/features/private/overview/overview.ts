import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MemberListItem, MembersResponse } from '../../../core/models/member.model';
import { CalendarEvent } from '../../../core/models/event.model';
import { Article } from '../../../core/models/article.model';
import { MembersService } from '../../../core/services/members/members';
import { EventsService } from '../../../core/services/events/events';
import { ArticlesService } from '../../../core/services/articles/articles';
import { FinanceService, FinanceSummary } from '../../../core/services/finance/finance';
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
  private financeService  = inject(FinanceService);

  direttivo      = signal<MemberListItem[]>([]);
  soci           = signal<MemberListItem[]>([]);
  events         = signal<CalendarEvent[]>([]);
  articles       = signal<Article[]>([]);
  financeSummary = signal<FinanceSummary | null>(null);
  loading        = signal(true);

  readonly upcomingCount = computed(() => {
    const now = new Date();
    return this.events().filter(e => new Date(e.date) >= now).length;
  });

  readonly sociAttiviCount = computed(() =>
    [...this.direttivo(), ...this.soci()].filter(s => s.status === 'attivo').length
  );

  readonly sociInAttesaCount = computed(() =>
    this.soci().filter(s => s.status === 'in_attesa_pagamento' || s.status === 'pagamento_in_corso').length
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
      delta: `di cui ${this.direttivo().filter(d => d.status === 'attivo').length} nel direttivo · ${this.sociInAttesaCount()} in attesa`,
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
      icon: 'account_balance_wallet',
      label: 'Entrate Totali',
      value: this.loading() ? '—' : this.fmt(this.financeSummary()?.totale ?? 0),
      delta: `${this.fmt(this.financeSummary()?.questoMese ?? 0)} questo mese`,
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
      members:  this.membersService.getAll(),
      events:   this.eventsService.getAll(),
      articles: this.articlesService.getAll(),
      finance:  this.financeService.getSummary(),
    }).subscribe({
      next: ({ members, events, articles, finance }) => {
        this.direttivo.set((members as MembersResponse).direttivo);
        this.soci.set((members as MembersResponse).soci);
        this.events.set(events);
        this.articles.set(articles);
        this.financeSummary.set(finance);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

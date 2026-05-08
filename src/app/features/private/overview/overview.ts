import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DirettivoMember, MembersResponse, SocioMember } from '../../../core/models/member.model';
import { CalendarEvent } from '../../../core/models/event.model';
import { Article } from '../../../core/models/article.model';
import { MembersService } from '../../../core/services/members/members';
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

  direttivo = signal<DirettivoMember[]>([]);
  soci      = signal<SocioMember[]>([]);
  events    = signal<CalendarEvent[]>([]);
  articles  = signal<Article[]>([]);
  loading   = signal(true);

  readonly upcomingCount = computed(() => {
    const now = new Date();
    return this.events().filter(e => new Date(e.date) >= now).length;
  });

  readonly sociAttiviCount = computed(() =>
    this.soci().filter(s => s.status === 'attivo').length
  );

  readonly articlesThisMonth = computed(() => {
    const start = new Date();
    start.setDate(1); start.setHours(0, 0, 0, 0);
    return this.articles().filter(a => new Date(a.createdAt) >= start).length;
  });

  readonly stats = computed(() => [
    {
      icon: 'group',
      label: 'Soci Attivi',
      value: this.loading() ? '—' : String(this.sociAttiviCount()),
      delta: `di cui ${this.direttivo().length} nel direttivo`,
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
      icon: 'people',
      label: 'Soci Totali',
      value: this.loading() ? '—' : String(this.soci().length),
      delta: `${this.soci().filter(s => s.status === 'in_attesa_pagamento').length} in attesa`,
      positive: false,
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
    }).subscribe({
      next: ({ members, events, articles }) => {
        this.direttivo.set((members as MembersResponse).direttivo);
        this.soci.set((members as MembersResponse).soci);
        this.events.set(events);
        this.articles.set(articles);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

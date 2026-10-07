import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { CalendarEvent } from '../../../core/models/event.model';
import { Article } from '../../../core/models/article.model';
import { EventsService } from '../../../core/services/events/events';
import { ArticlesService } from '../../../core/services/articles/articles';
import { SiteSettingsService } from '../../../core/services/site-settings/site-settings';
import { ArticleCard } from '../../../shared/components/public/article/article';
import { EventShort } from '../../../shared/components/public/event-short/event-short';


const ACCENTS = ['border-secondary', 'border-[#f8bd2a]', 'border-primary/40'];

@Component({
  selector: 'app-home',
  imports: [RouterLink, TranslatePipe, ArticleCard, EventShort],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  private eventsService   = inject(EventsService);
  private articlesService = inject(ArticlesService);
  readonly siteSettings   = inject(SiteSettingsService);

  allEvents = signal<CalendarEvent[] | null>(null);
  allNews   = signal<Article[] | null>(null);

  eventBannerVisible = signal(false);
  eventBannerDismissed = signal(false);

  private bannerTimer: ReturnType<typeof setTimeout> | null = null;

  readonly upcoming = computed(() => {
    const events = this.allEvents();
    if (events === null) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events.filter(e => {
      const d = new Date(e.date);
      d.setHours(0, 0, 0, 0);
      return d >= today;
    }).slice(0, 3);
  });

  readonly nextEvent = computed(() => this.upcoming()?.[0] ?? null);

  readonly isNextEventOngoing = computed(() => {
    const ev = this.nextEvent();
    if (!ev) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(ev.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  readonly latestNews = computed(() => this.allNews()?.slice(0, 3) ?? null);

  ngOnInit(): void {
    this.siteSettings.load();
    this.eventsService.getAll().subscribe({
      next: evts => {
        this.allEvents.set(evts);
        this.scheduleBanner();
      },
    });
    this.articlesService.getAll().subscribe({
      next: arts => this.allNews.set(arts),
    });
  }

  ngOnDestroy(): void {
    if (this.bannerTimer) clearTimeout(this.bannerTimer);
  }

  private scheduleBanner(): void {
    if (this.nextEvent() === null) return;
    this.bannerTimer = setTimeout(() => {
      if (!this.eventBannerDismissed()) this.eventBannerVisible.set(true);
    }, 2000);
  }

  dismissBanner(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.eventBannerVisible.set(false);
    this.eventBannerDismissed.set(true);
  }

  accent(index: number): string {
    return ACCENTS[index % ACCENTS.length];
  }

  formatHeroDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }

}

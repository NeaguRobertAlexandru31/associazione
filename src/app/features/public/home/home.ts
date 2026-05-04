import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { CalendarEvent } from '../../../core/models/event.model';
import { Article } from '../../../core/models/article.model';
import { EventsService } from '../../../core/services/events/events';
import { ArticlesService } from '../../../core/services/articles/articles';
import { environment } from '../../../../environments/environment';

const ACCENTS = ['border-secondary', 'border-[#f8bd2a]', 'border-primary/40'];

@Component({
  selector: 'app-home',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private eventsService   = inject(EventsService);
  private articlesService = inject(ArticlesService);

  parallaxOffset = 0;

  allEvents = signal<CalendarEvent[]>([]);
  allNews   = signal<Article[]>([]);

  readonly upcoming = computed(() => {
    const now = new Date();
    return this.allEvents()
      .filter(e => new Date(e.date) >= now)
      .slice(0, 3);
  });

  readonly nextEvent = computed(() => this.upcoming()[0] ?? null);

  readonly latestNews = computed(() => this.allNews().slice(0, 3));

  ngOnInit(): void {
    this.eventsService.getAll().subscribe({
      next: evts => this.allEvents.set(evts),
    });
    this.articlesService.getAll().subscribe({
      next: arts => this.allNews.set(arts),
    });
  }

  accent(index: number): string {
    return ACCENTS[index % ACCENTS.length];
  }

  coverImage(a: Article): string {
    const img = a.images[0];
    if (!img) return '/img/hero.jpg';
    return img.startsWith('http') ? img : `${environment.apiUrl}${img}`;
  }

  firstCategory(a: Article): string {
    return a.categories[0] ?? '';
  }

  formatDay(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit' });
  }

  formatMonth(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', { month: 'short' }).toUpperCase();
  }

  formatHeroDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  formatNewsDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.parallaxOffset = window.scrollY * 0.25;
  }
}

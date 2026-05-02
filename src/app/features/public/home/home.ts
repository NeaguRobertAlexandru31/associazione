import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { CalendarEvent } from '../../../core/models/event.model';
import { EventsService } from '../../../core/services/events/events';

export interface NewsItem {
  img: string;
  categoryKey: string;
  categoryColor: string;
  dateKey: string;
  titleKey: string;
  descKey: string;
}

const ACCENTS = ['border-secondary', 'border-[#f8bd2a]', 'border-primary/40'];

@Component({
  selector: 'app-home',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private eventsService = inject(EventsService);

  parallaxOffset = 0;

  allEvents = signal<CalendarEvent[]>([]);

  readonly upcoming = computed(() => {
    const now = new Date();
    return this.allEvents()
      .filter(e => new Date(e.date) >= now)
      .slice(0, 3);
  });

  readonly nextEvent = computed(() => this.upcoming()[0] ?? null);

  readonly news: NewsItem[] = [
    {
      img: '/img/hero.jpg',
      categoryKey: 'home.news_1_category',
      categoryColor: 'bg-secondary/10 text-secondary',
      dateKey: 'home.news_1_date',
      titleKey: 'home.news_1_title',
      descKey: 'home.news_1_desc',
    },
    {
      img: '/img/news2.jpg',
      categoryKey: 'home.news_2_category',
      categoryColor: 'bg-primary/10 text-primary',
      dateKey: 'home.news_2_date',
      titleKey: 'home.news_2_title',
      descKey: 'home.news_2_desc',
    },
    {
      img: '/img/news3.jpg',
      categoryKey: 'home.news_3_category',
      categoryColor: 'bg-[#0d6e6e]/10 text-[#0d6e6e]',
      dateKey: 'home.news_3_date',
      titleKey: 'home.news_3_title',
      descKey: 'home.news_3_desc',
    },
  ];

  ngOnInit(): void {
    this.eventsService.getAll().subscribe({
      next: evts => this.allEvents.set(evts),
    });
  }

  accent(index: number): string {
    return ACCENTS[index % ACCENTS.length];
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

  @HostListener('window:scroll')
  onScroll(): void {
    this.parallaxOffset = window.scrollY * 0.25;
  }
}

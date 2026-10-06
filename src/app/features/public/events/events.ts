import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { CalendarEvent } from '../../../core/models/event.model';
import { EventsService } from '../../../core/services/events/events';
import { SiteSettingsService } from '../../../core/services/site-settings/site-settings';
import { environment } from '../../../../environments/environment';
import { EventCard } from '../../../shared/components/public/event/event';

@Component({
  selector: 'app-events',
  imports: [RouterLink, TranslatePipe, EventCard],
  templateUrl: './events.html',
  styleUrl: './events.css',
})
export class Events implements OnInit {
  private eventsService = inject(EventsService);
  readonly siteSettings = inject(SiteSettingsService);

  events  = signal<CalendarEvent[]>([]);
  loading = signal(true);

  readonly ongoing = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.events().filter(e => {
      const d = new Date(e.date);
      d.setHours(0, 0, 0, 0);
      return d >= today && d <= today;
    });
  });

  readonly upcoming = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.events()
      .filter(e => {
        const d = new Date(e.date);
        d.setHours(0, 0, 0, 0);
        return d > today;
      })
      .slice(0, 6);
  });

  readonly featured = computed(() => this.upcoming()[0] ?? null);

  readonly archived = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return this.events()
      .filter(e => {
        const d = new Date(e.date);
        d.setHours(0, 0, 0, 0);
        return d < today;
      })
      .slice(0, 3);
  });

  ngOnInit(): void {
    this.siteSettings.load();
    this.eventsService.getAll().subscribe({
      next: evts => { this.events.set(evts); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  resolveImg(path: string | undefined): string {
    if (!path) return this.siteSettings.placeholder('placeholder_page_hero');
    return path.startsWith('http') ? path : `${environment.apiUrl}${path}`;
  }

  formatDay(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit' });
  }

  formatMonth(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', { month: 'short' }).toUpperCase();
  }

  formatFullDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }
}

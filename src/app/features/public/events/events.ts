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

  readonly upcoming = computed(() => {
    const now = new Date();
    return this.events()
      .filter(e => new Date(e.date) >= now)
      .slice(0, 6);
  });

  readonly featured = computed(() => this.upcoming()[0] ?? null);

  readonly archived = computed(() => {
    const now = new Date();
    return this.events()
      .filter(e => new Date(e.date) < now)
      .slice(0, 3);
  });

  ngOnInit(): void {
    this.siteSettings.load();
    this.eventsService.getAll().subscribe({
      next: evts => { this.events.set(evts); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  resolveImg(path: string | undefined, fallback: string): string {
    if (!path) return fallback;
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

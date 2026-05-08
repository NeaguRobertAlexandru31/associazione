import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CalendarEvent } from '../../../../core/models/event.model';
import { SiteSettingsService } from '../../../../core/services/site-settings/site-settings';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-event',
  imports: [RouterLink],
  templateUrl: './event.html',
  styleUrl: './event.css',
})
export class EventCard {
  private siteSettings = inject(SiteSettingsService);
  event = input.required<CalendarEvent>();

  readonly day   = computed(() =>
    new Date(this.event().date).toLocaleDateString('it-IT', { day: '2-digit' })
  );

  readonly month = computed(() =>
    new Date(this.event().date).toLocaleDateString('it-IT', { month: 'short' }).toUpperCase()
  );

  readonly img = computed(() => {
    const path = this.event().images[0];
    if (!path) return this.siteSettings.placeholder('placeholder_page_hero');
    return path.startsWith('http') ? path : `${environment.apiUrl}${path}`;
  });
}

import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../i18n/translate.pipe';
import { CalendarEvent } from '../../../../core/models/event.model';
import { environment } from '../../../../../environments/environment';
import { SiteSettingsService } from '../../../../core/services/site-settings/site-settings';

@Component({
  selector: 'app-event-short',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './event-short.html',
  styleUrl: './event-short.css',
})
export class EventShort {
  event       = input.required<CalendarEvent>();
  accentClass = input<string>('border-secondary');

  private siteSettings = inject(SiteSettingsService);

  readonly day   = computed(() =>
    new Date(this.event().date).toLocaleDateString('it-IT', { day: '2-digit' })
  );

  readonly month = computed(() =>
    new Date(this.event().date).toLocaleDateString('it-IT', { month: 'short' }).toUpperCase()
  );

  readonly coverImg = computed(() => {
    const ev = this.event();
    const path = ev.cover ?? ev.images?.[0];
    if (!path) return this.siteSettings.placeholder('placeholder_page_hero');
    return path.startsWith('http') ? path : `${environment.apiUrl}${path}`;
  });

  readonly isMembersOnly = computed(() => this.event().accessType === 'members_only');
  readonly isLimited     = computed(() => this.event().hasCapacity && this.event().capacity != null);
  readonly isPublicOpen  = computed(() => this.event().accessType === 'public' && !this.event().hasCapacity);
  readonly isOngoing     = computed(() => {
    const now   = new Date();
    const ev    = this.event();
    const d     = new Date(ev.date);
    if (d.toDateString() !== now.toDateString()) return false;
    const [h, m] = (ev.time ?? '00:00').split(':').map(Number);
    const start  = new Date(d);
    start.setHours(h, m, 0, 0);
    return now >= start;
  });
}

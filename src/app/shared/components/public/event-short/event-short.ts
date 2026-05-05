import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../i18n/translate.pipe';
import { CalendarEvent } from '../../../../core/models/event.model';

@Component({
  selector: 'app-event-short',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './event-short.html',
  styleUrl: './event-short.css',
})
export class EventShort {
  event       = input.required<CalendarEvent>();
  accentClass = input<string>('border-secondary');

  readonly day   = computed(() =>
    new Date(this.event().date).toLocaleDateString('it-IT', { day: '2-digit' })
  );

  readonly month = computed(() =>
    new Date(this.event().date).toLocaleDateString('it-IT', { month: 'short' }).toUpperCase()
  );
}

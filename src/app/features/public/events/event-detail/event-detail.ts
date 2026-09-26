import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CalendarEvent } from '../../../../core/models/event.model';
import { EventsService } from '../../../../core/services/events/events';
import { environment } from '../../../../../environments/environment';

type RsvpStatus = 'attending' | 'interested';
type RsvpStep = 'idle' | 'form' | 'success' | 'error';

@Component({
  selector: 'app-event-detail',
  imports: [RouterLink, FormsModule],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.css',
})
export class EventDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private svc   = inject(EventsService);

  event         = signal<CalendarEvent | null>(null);
  loading       = signal(true);
  notFound      = signal(false);
  lightboxIndex = signal<number | null>(null);

  rsvpStep      = signal<RsvpStep>('idle');
  rsvpStatus    = signal<RsvpStatus>('attending');
  rsvpName      = signal('');
  rsvpEmail     = signal('');
  rsvpSending   = signal(false);

  rsvpStats = signal<{ attending: number; interested: number; total: number } | null>(null);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.svc.getBySlug(slug).subscribe({
      next: ev => {
        this.event.set(ev);
        this.loading.set(false);
        this.svc.getRsvpStats(ev.id).subscribe({ next: s => this.rsvpStats.set(s), error: () => {} });
      },
      error: () => { this.notFound.set(true); this.loading.set(false); },
    });
  }

  openRsvpForm(status: RsvpStatus): void {
    this.rsvpStatus.set(status);
    this.rsvpStep.set('form');
  }

  submitRsvp(): void {
    const name = this.rsvpName().trim();
    if (!name) return;
    const ev = this.event();
    if (!ev) return;

    this.rsvpSending.set(true);
    const body: { name: string; email?: string; status: RsvpStatus } = {
      name,
      status: this.rsvpStatus(),
    };
    const email = this.rsvpEmail().trim();
    if (email) body.email = email;

    this.svc.rsvp(ev.id, body).subscribe({
      next: () => { this.rsvpStep.set('success'); this.rsvpSending.set(false); },
      error: () => { this.rsvpStep.set('error');   this.rsvpSending.set(false); },
    });
  }

  cancelRsvp(): void { this.rsvpStep.set('idle'); }

  googleCalendarUrl(ev: CalendarEvent): string {
    const start = this.toGCalDate(ev.date, ev.time);
    const end   = this.toGCalDate(ev.date, ev.time, 2);
    const params = new URLSearchParams({
      action:   'TEMPLATE',
      text:     ev.name,
      dates:    `${start}/${end}`,
      location: ev.location,
      details:  ev.description ?? '',
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  downloadIcs(ev: CalendarEvent): void {
    const start = this.toIcsDate(ev.date, ev.time);
    const end   = this.toIcsDate(ev.date, ev.time, 2);
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ACR//Events//IT',
      'BEGIN:VEVENT',
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${ev.name}`,
      `LOCATION:${ev.location}`,
      `DESCRIPTION:${ev.description ?? ''}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${ev.name.replace(/\s+/g, '-')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  resolveImg(path: string): string {
    if (path.startsWith('http')) return path;
    return `${environment.apiUrl}${path}`;
  }

  openLightbox(index: number): void { this.lightboxIndex.set(index); }
  closeLightbox(): void             { this.lightboxIndex.set(null);  }

  prev(images: string[]): void {
    this.lightboxIndex.update(i => i !== null ? (i - 1 + images.length) % images.length : 0);
  }

  next(images: string[]): void {
    this.lightboxIndex.update(i => i !== null ? (i + 1) % images.length : 0);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  private toGCalDate(dateIso: string, time: string, addHours = 0): string {
    const [h, m] = time.replace('.', ':').split(':').map(Number);
    const d = new Date(dateIso);
    d.setUTCHours((h || 0) + addHours, m || 0, 0, 0);
    return d.toISOString().replace(/[-:]/g, '').replace('.000', '');
  }

  private toIcsDate(dateIso: string, time: string, addHours = 0): string {
    return this.toGCalDate(dateIso, time, addHours);
  }
}

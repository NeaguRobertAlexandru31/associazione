import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BookingAvailability, CalendarEvent, EventPhoto } from '../../../../core/models/event.model';
import { EventsService } from '../../../../core/services/events/events';
import { environment } from '../../../../../environments/environment';

type RsvpStatus = 'attending' | 'interested';
type RsvpStep = 'idle' | 'form' | 'success' | 'error';
type BookingStep = 'idle' | 'form' | 'success' | 'waitlist' | 'error';

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

  rsvpStats              = signal<{ attending: number; interested: number; total: number } | null>(null);
  participantPhotos      = signal<EventPhoto[]>([]);
  participantLightboxIndex = signal<number | null>(null);
  uploadUrl              = signal<string | null>(null);
  shareLinkCopied        = signal(false);

  // ── Prenotazione ──────────────────────────────────────────────────────
  availability    = signal<BookingAvailability | null>(null);
  bookingStep     = signal<BookingStep>('idle');
  bookingName     = signal('');
  bookingEmail    = signal('');
  bookingPhone    = signal('');
  bookingSeats    = signal(1);
  bookingSending  = signal(false);
  bookingError    = signal('');
  bookingPosition = signal<number | null>(null);

  readonly isSoldOut = computed(() => {
    const a = this.availability();
    return a?.hasCapacity && (a.available ?? 0) === 0;
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.svc.getBySlug(slug).subscribe({
      next: ev => {
        this.event.set(ev);
        this.loading.set(false);
        this.svc.getRsvpStats(ev.id).subscribe({ next: s => this.rsvpStats.set(s), error: () => {} });
        this.svc.getPublicPhotos(slug).subscribe({ next: photos => this.participantPhotos.set(photos), error: () => {} });
        this.svc.getShareLink(slug).subscribe({
          next: ({ uploadUrl }) => this.uploadUrl.set(`${window.location.origin}${uploadUrl}`),
          error: () => {},
        });
        if (ev.hasCapacity) {
          this.svc.getAvailability(slug).subscribe({
            next: a => this.availability.set(a),
            error: () => {},
          });
        }
      },
      error: () => { this.notFound.set(true); this.loading.set(false); },
    });
  }

  // ── Prenotazione ──────────────────────────────────────────────────────
  openBookingForm(): void { this.bookingStep.set('form'); }
  cancelBooking(): void   { this.bookingStep.set('idle'); }

  submitBooking(): void {
    const name  = this.bookingName().trim();
    const email = this.bookingEmail().trim();
    const seats = this.bookingSeats();
    const ev    = this.event();
    if (!name || !email || !ev?.slug) return;
    if (seats < 1 || seats > 4) { this.bookingError.set('Puoi prenotare da 1 a 4 posti'); return; }

    this.bookingSending.set(true);
    this.bookingError.set('');

    this.svc.book(ev.slug, {
      name,
      email,
      phone: this.bookingPhone().trim() || undefined,
      seats,
    }).subscribe({
      next: res => {
        this.bookingSending.set(false);
        if (res.status === 'confirmed') {
          this.bookingStep.set('success');
          // Aggiorna disponibilità
          this.svc.getAvailability(ev.slug!).subscribe({ next: a => this.availability.set(a), error: () => {} });
        } else {
          this.bookingPosition.set(res.position ?? null);
          this.bookingStep.set('waitlist');
        }
      },
      error: err => {
        this.bookingSending.set(false);
        this.bookingError.set(err?.error?.message ?? 'Errore durante la prenotazione. Riprova.');
      },
    });
  }

  // ── Foto partecipanti ─────────────────────────────────────────────────
  openParticipantLightbox(index: number): void  { this.participantLightboxIndex.set(index); }
  closeParticipantLightbox(): void              { this.participantLightboxIndex.set(null); }
  prevParticipant(): void {
    const len = this.participantPhotos().length;
    this.participantLightboxIndex.update(i => i !== null ? (i - 1 + len) % len : 0);
  }
  nextParticipant(): void {
    const len = this.participantPhotos().length;
    this.participantLightboxIndex.update(i => i !== null ? (i + 1) % len : 0);
  }

  copyShareLink(): void {
    const url = this.uploadUrl();
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      this.shareLinkCopied.set(true);
      setTimeout(() => this.shareLinkCopied.set(false), 2000);
    });
  }

  // ── RSVP ──────────────────────────────────────────────────────────────
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
    const body: { name: string; email?: string; status: RsvpStatus } = { name, status: this.rsvpStatus() };
    const email = this.rsvpEmail().trim();
    if (email) body.email = email;
    this.svc.rsvp(ev.id, body).subscribe({
      next: () => { this.rsvpStep.set('success'); this.rsvpSending.set(false); },
      error: () => { this.rsvpStep.set('error');   this.rsvpSending.set(false); },
    });
  }

  cancelRsvp(): void { this.rsvpStep.set('idle'); }

  // ── Calendar / Utility ────────────────────────────────────────────────
  googleCalendarUrl(ev: CalendarEvent): string {
    const start = this.toGCalDate(ev.date, ev.time);
    const end   = this.toGCalDate(ev.date, ev.time, 2);
    const params = new URLSearchParams({ action: 'TEMPLATE', text: ev.name, dates: `${start}/${end}`, location: ev.location, details: ev.description ?? '' });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  downloadIcs(ev: CalendarEvent): void {
    const start = this.toIcsDate(ev.date, ev.time);
    const end   = this.toIcsDate(ev.date, ev.time, 2);
    const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//ACR//Events//IT','BEGIN:VEVENT',`DTSTART:${start}`,`DTEND:${end}`,`SUMMARY:${ev.name}`,`LOCATION:${ev.location}`,`DESCRIPTION:${ev.description ?? ''}`, 'END:VEVENT','END:VCALENDAR'].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${ev.name.replace(/\s+/g, '-')}.ics`; a.click();
    URL.revokeObjectURL(url);
  }

  resolveImg(path: string): string {
    return path.startsWith('http') ? path : `${environment.apiUrl}${path}`;
  }

  openLightbox(index: number): void { this.lightboxIndex.set(index); }
  closeLightbox(): void             { this.lightboxIndex.set(null);  }
  prev(images: string[]): void { this.lightboxIndex.update(i => i !== null ? (i - 1 + images.length) % images.length : 0); }
  next(images: string[]): void { this.lightboxIndex.update(i => i !== null ? (i + 1) % images.length : 0); }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  formatDayNumber(iso: string): number { return new Date(iso).getDate(); }

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

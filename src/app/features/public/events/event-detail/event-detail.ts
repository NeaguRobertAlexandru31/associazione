import { Component, OnInit, OnDestroy, computed, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BookingAvailability, CalendarEvent, EventPhoto, EventAccessType } from '../../../../core/models/event.model';
import { EventsService } from '../../../../core/services/events/events';
import { Analytics } from '../../../../core/services/analytics/analytics';
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
export class EventDetail implements OnInit, OnDestroy {
  private route     = inject(ActivatedRoute);
  private svc       = inject(EventsService);
  private analytics = inject(Analytics);

  private bookingObserver?: IntersectionObserver;
  private bookingEl?: HTMLElement;
  readonly bookingSectionVisible = signal(false);

  @ViewChild('bookingSection') set bookingSectionRef(el: ElementRef<HTMLElement> | undefined) {
    this.bookingObserver?.disconnect();
    this.bookingEl = el?.nativeElement;
    if (!el) return;
    this.bookingObserver = new IntersectionObserver(
      ([entry]) => this.bookingSectionVisible.set(entry.isIntersecting),
      { threshold: 0.1 }
    );
    this.bookingObserver.observe(el.nativeElement);
  }

  private rsvpObserver?: IntersectionObserver;
  private rsvpEl?: HTMLElement;
  readonly rsvpSectionVisible = signal(false);

  @ViewChild('rsvpSection') set rsvpSectionRef(el: ElementRef<HTMLElement> | undefined) {
    this.rsvpObserver?.disconnect();
    this.rsvpEl = el?.nativeElement;
    if (!el) return;
    this.rsvpObserver = new IntersectionObserver(
      ([entry]) => this.rsvpSectionVisible.set(entry.isIntersecting),
      { threshold: 0.1 }
    );
    this.rsvpObserver.observe(el.nativeElement);
  }

  scrollToRsvp(): void {
    this.rsvpEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  scrollToBooking(): void {
    this.openBookingForm();
    setTimeout(() => this.bookingEl?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  event         = signal<CalendarEvent | null>(null);
  loading       = signal(true);
  notFound      = signal(false);
  lightboxIndex = signal<number | null>(null);
  toastDismissed = signal(false);
  toastVisible   = signal(false);

  rsvpStep      = signal<RsvpStep>('idle');
  rsvpStatus    = signal<RsvpStatus>('attending');
  rsvpName      = signal('');
  rsvpEmail     = signal('');
  rsvpSending   = signal(false);

  rsvpStats              = signal<{ attending: number; interested: number; total: number } | null>(null);
  participantPhotos      = signal<EventPhoto[]>([]);
  participantLightboxIndex = signal<number | null>(null);
  uploadUrl              = signal<string | null>(null);

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

  readonly isMembersOnly  = computed(() => this.event()?.accessType === 'members_only');
  readonly isLimited      = computed(() => this.event()?.accessType === 'limited');
  readonly eventStarted   = computed(() => {
    const date = this.event()?.date;
    if (!date) return false;
    const today = new Date().toISOString().slice(0, 10);
    return new Date(date).toISOString().slice(0, 10) <= today;
  });

  readonly isArchived = computed(() => {
    const date = this.event()?.date;
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
  });

  readonly isOngoing = computed(() => {
    const date = this.event()?.date;
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  ngOnDestroy(): void {
    this.bookingObserver?.disconnect();
    this.rsvpObserver?.disconnect();
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.svc.getBySlug(slug).subscribe({
      next: ev => {
        this.event.set(ev);
        this.loading.set(false);
        setTimeout(() => this.toastVisible.set(true), 1000);
        this.svc.getRsvpStats(ev.id).subscribe({ next: s => this.rsvpStats.set(s), error: () => {} });
        this.svc.getPublicPhotos(slug).subscribe({ next: photos => this.participantPhotos.set(photos), error: () => {} });
        this.svc.getShareLink(slug).subscribe({
          next: ({ uploadUrl }) => this.uploadUrl.set(`${window.location.origin}${uploadUrl}`),
          error: () => {},
        });
        if (ev.hasCapacity || ev.accessType === 'members_only') {
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
          this.analytics.capture('event_booked', { event: ev.name, seats });
          this.bookingStep.set('success');
          this.svc.getAvailability(ev.slug!).subscribe({ next: a => this.availability.set(a), error: () => {} });
        } else {
          this.analytics.capture('event_booked_waitlist', { event: ev.name, seats, position: res.position ?? 0 });
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


  // ── RSVP ──────────────────────────────────────────────────────────────
  openRsvpForm(status: RsvpStatus): void {
    this.rsvpStatus.set(status);
    this.rsvpStep.set('form');
  }

  submitRsvp(): void {
    const name  = this.rsvpName().trim();
    const email = this.rsvpEmail().trim();
    if (!name) return;
    if (this.isMembersOnly() && !email) return;
    const ev = this.event();
    if (!ev) return;
    this.rsvpSending.set(true);
    const body: { name: string; email?: string; status: RsvpStatus } = { name, status: this.rsvpStatus() };
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
    const params = new URLSearchParams({ action: 'TEMPLATE', text: ev.name, location: ev.location, details: ev.description ?? '' });
    return `https://calendar.google.com/calendar/render?${params.toString()}&dates=${start}/${end}`;
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
    // Estrae anno/mese/giorno dalla stringa ISO senza conversioni di fuso orario
    const [year, month, day] = dateIso.slice(0, 10).split('-').map(Number);
    const d = new Date(year, month - 1, day, (h || 0) + addHours, m || 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${year}${pad(month)}${pad(day)}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  }

}

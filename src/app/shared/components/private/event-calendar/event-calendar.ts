import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Booking, CalendarEvent, CreateEventDto, EventAccessType, EventPhoto, EventRsvp, RsvpStats } from '../../../../core/models/event.model';
import { EventsService } from '../../../../core/services/events/events';
import { environment } from '../../../../../environments/environment';
import { BookingScanner } from '../../../../features/private/events/booking-scanner/booking-scanner';
import { DatePicker } from '../../../../shared/components/private/date-picker/date-picker';
import { TimePicker } from '../../../../shared/components/private/time-picker/time-picker';
import { LocationAutocomplete } from '../../../../shared/components/private/location-autocomplete/location-autocomplete';

export interface ImagePreview {
  file:      File;
  preview:   string;
  uploading: boolean;
  url:       string | null;
  error:     boolean;
}

type DetailTab = 'info' | 'rsvp' | 'photos' | 'bookings';

@Component({
  selector: 'app-event-calendar',
  imports: [FormsModule, DatePipe, BookingScanner, DatePicker, TimePicker, LocationAutocomplete],
  templateUrl: './event-calendar.html',
  styleUrl: './event-calendar.css',
})
export class EventCalendar implements OnInit {
  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;

  private eventsService = inject(EventsService);
  private http          = inject(HttpClient);
  private router        = inject(Router);

  events   = signal<CalendarEvent[]>([]);
  loading  = signal(false);
  saving   = signal(false);
  deleting = signal<string | null>(null);

  showCreateModal = signal(false);
  detailEvent     = signal<CalendarEvent | null>(null);
  detailTab       = signal<DetailTab>('info');

  rsvpStatsMap  = signal<Record<string, RsvpStats>>({});
  detailRsvps   = signal<EventRsvp[]>([]);
  rsvpLoading   = signal(false);

  // ── Foto partecipanti ─────────────────────────────────────────────────
  eventPhotos      = signal<EventPhoto[]>([]);
  photosLoading    = signal(false);
  photoDeletingId  = signal<string | null>(null);
  photoApprovingId = signal<string | null>(null);
  pendingPhotos    = computed(() => this.eventPhotos().filter(p => !p.approved));
  approvedPhotos   = computed(() => this.eventPhotos().filter(p => p.approved));

  // ── QR ────────────────────────────────────────────────────────────────
  qrLoading    = signal(false);
  qrUploadUrl  = signal<string | null>(null);
  qrCopied     = signal(false);
  lanIp        = signal<string | null>(null);

  readonly isLocalhost = computed(() => window.location.hostname === 'localhost');
  readonly lanUrl      = computed(() => {
    const ip = this.lanIp();
    return ip ? `http://${ip}:4200` : null;
  });

  // ── Prenotazioni ──────────────────────────────────────────────────────
  bookings         = signal<Booking[]>([]);
  bookingsLoading  = signal(false);
  bookingsCapacity = signal<number | null>(null);
  bookingsOccupied = signal(0);
  bookingsAvailable = signal(0);
  showScanner      = signal(false);
  readonly confirmedBookings = computed(() => this.bookings().filter(b => b.status === 'confirmed'));
  readonly waitlistBookings  = computed(() => this.bookings().filter(b => b.status === 'waitlist'));

  imagePreviews = signal<ImagePreview[]>([]);
  coverPreview  = signal<ImagePreview | null>(null);
  form: CreateEventDto = { name: '', date: '', time: '', location: '', description: '', images: [], cover: undefined, accessType: 'public', capacity: undefined };


  readonly allUploaded = computed(() =>
    this.imagePreviews().every(p => p.url !== null || p.error) &&
    (this.coverPreview() === null || this.coverPreview()!.url !== null || this.coverPreview()!.error),
  );

  ngOnInit(): void {
    this.load();
    if (this.isLocalhost()) {
      this.http.get<{ lanIp: string | null }>(`${environment.apiUrl}/dev-info`).subscribe({
        next: ({ lanIp }) => this.lanIp.set(lanIp),
        error: () => {},
      });
    }
  }

  load(): void {
    this.loading.set(true);
    this.eventsService.getAll().subscribe({
      next: evts => {
        this.events.set(evts);
        this.loading.set(false);
        this.loadAllStats(evts);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadAllStats(evts: CalendarEvent[]): void {
    evts.forEach(ev => {
      this.eventsService.getRsvpStats(ev.id).subscribe({
        next: stats => this.rsvpStatsMap.update(m => ({ ...m, [ev.id]: stats })),
        error: () => {},
      });
    });
  }

  statsFor(eventId: string): RsvpStats | null {
    return this.rsvpStatsMap()[eventId] ?? null;
  }

  openCreate(): void {
    this.form = { name: '', date: '', time: '', location: '', description: '', images: [], cover: undefined, accessType: 'public', capacity: undefined };
    this.clearPreviews();
    this.showCreateModal.set(true);
  }

  closeCreate(): void {
    this.showCreateModal.set(false);
    this.clearPreviews();
  }

  openDetail(evt: CalendarEvent): void {
    if (evt.slug) {
      this.router.navigate(['/dashboard/events', evt.slug]);
    }
  }

  closeDetail(): void { this.detailEvent.set(null); }

  switchTab(tab: DetailTab): void {
    this.detailTab.set(tab);
    const ev = this.detailEvent();
    if (!ev) return;

    if (tab === 'rsvp') {
      this.rsvpLoading.set(true);
      this.eventsService.getRsvpList(ev.id).subscribe({
        next: list => { this.detailRsvps.set(list); this.rsvpLoading.set(false); },
        error: ()   => this.rsvpLoading.set(false),
      });
    }

    if (tab === 'photos') {
      this.loadPhotos(ev.slug ?? '');
      const url = this.qrUploadUrl();
      if (url) setTimeout(() => this.drawBrandedQr(url, ev.name), 50);
    }

    if (tab === 'bookings') {
      this.loadBookings(ev.slug ?? '');
    }
  }

  private loadBookings(slug: string): void {
    this.bookingsLoading.set(true);
    this.eventsService.getBookingsAdmin(slug).subscribe({
      next: ({ bookings, capacity, occupied, available }) => {
        this.bookings.set(bookings);
        this.bookingsCapacity.set(capacity);
        this.bookingsOccupied.set(occupied);
        this.bookingsAvailable.set(available);
        this.bookingsLoading.set(false);
      },
      error: () => this.bookingsLoading.set(false),
    });
  }

  private loadPhotos(slug: string): void {
    this.photosLoading.set(true);
    this.eventsService.getEventPhotosAdmin(slug).subscribe({
      next: photos => { this.eventPhotos.set(photos); this.photosLoading.set(false); },
      error: ()    => this.photosLoading.set(false),
    });
  }

  approvePhoto(photoId: string): void {
    const ev = this.detailEvent();
    if (!ev) return;
    this.photoApprovingId.set(photoId);
    this.eventsService.approvePhoto(ev.slug ?? '', photoId).subscribe({
      next: updated => {
        this.eventPhotos.update(list => list.map(p => p.id === photoId ? updated : p));
        this.photoApprovingId.set(null);
      },
      error: () => this.photoApprovingId.set(null),
    });
  }

  deletePhoto(photoId: string): void {
    const ev = this.detailEvent();
    if (!ev) return;
    this.photoDeletingId.set(photoId);
    this.eventsService.deletePhoto(ev.slug ?? '', photoId).subscribe({
      next: () => {
        this.eventPhotos.update(list => list.filter(p => p.id !== photoId));
        this.photoDeletingId.set(null);
      },
      error: () => this.photoDeletingId.set(null),
    });
  }

  generateQr(): void {
    const ev = this.detailEvent();
    if (!ev?.slug) return;

    // Usa il token già salvato sull'evento se presente
    if (ev.uploadUrl) {
      const origin = this.lanUrl() ?? window.location.origin;
      const fullUrl = `${origin}${ev.uploadUrl}`;
      this.qrUploadUrl.set(fullUrl);
      setTimeout(() => this.drawBrandedQr(fullUrl, ev.name), 50);
      return;
    }

    this.qrLoading.set(true);
    this.eventsService.getUploadToken(ev.slug).subscribe({
      next: ({ uploadUrl }) => {
        const origin = this.lanUrl() ?? window.location.origin;
        const fullUrl = `${origin}${uploadUrl}`;
        this.qrUploadUrl.set(fullUrl);
        // Aggiorna detailEvent con il nuovo uploadUrl
        this.detailEvent.update(e => e ? { ...e, uploadUrl } : e);
        this.qrLoading.set(false);
        setTimeout(() => this.drawBrandedQr(fullUrl, ev.name), 50);
      },
      error: () => this.qrLoading.set(false),
    });
  }

  async drawBrandedQr(url: string, _eventName: string): Promise<void> {
    const canvas = this.qrCanvas?.nativeElement;
    if (!canvas) return;

    const SIZE = 320;
    const { default: QRCodeStyling } = await import('qr-code-styling');

    const qr = new QRCodeStyling({
      width:  SIZE,
      height: SIZE,
      type:   'canvas',
      data:   url,
      margin: 10,
      qrOptions:   { errorCorrectionLevel: 'H' },
      dotsOptions: { type: 'rounded', color: '#1a2e5a' },
      cornersSquareOptions: { type: 'extra-rounded', color: '#1a2e5a' },
      cornersDotOptions:    { type: 'dot',           color: '#1a2e5a' },
      backgroundOptions:    { color: '#ffffff' },
      image: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="30" fill="#1a2e5a"/>
          <text x="30" y="35" font-family="Arial" font-weight="bold" font-size="13"
                fill="white" text-anchor="middle">APS Marama</text>
        </svg>`),
      imageOptions: { hideBackgroundDots: true, imageSize: 0.28, margin: 4, crossOrigin: 'anonymous' },
    });

    const blob = await qr.getRawData('png');
    if (!blob) return;

    const bmp = await createImageBitmap(blob as Blob);
    canvas.width  = SIZE;
    canvas.height = SIZE;
    canvas.getContext('2d')!.drawImage(bmp, 0, 0);
  }

  downloadQr(): void {
    const canvas = this.qrCanvas?.nativeElement;
    if (!canvas) return;
    const ev = this.detailEvent();
    const link = document.createElement('a');
    link.download = `qr-${ev?.slug ?? 'evento'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  downloadPoster(): void {
    const ev = this.detailEvent();
    const qrCanvas = this.qrCanvas?.nativeElement;
    if (!ev || !qrCanvas) return;

    const W = 794; // A4 landscape ~96dpi
    const H = 560;
    const poster = document.createElement('canvas');
    poster.width  = W;
    poster.height = H;
    const ctx = poster.getContext('2d')!;

    // Sfondo bianco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Banda sinistra colorata
    ctx.fillStyle = '#1a2e5a';
    ctx.fillRect(0, 0, 280, H);

    // Testo sulla banda
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('APS Marama', 140, 48);

    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('APS Marama', 140, 80);
    ctx.fillText('', 140, 98);

    // Divisore
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(40, 126, 200, 1);

    // Nome evento sulla banda
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';

    const words = ev.name.split(' ');
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > 220) { lines.push(line); line = word; }
      else line = test;
    }
    if (line) lines.push(line);
    lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, 140, 146 + i * 26));

    // Data e luogo
    const dateStr = new Date(ev.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
    ctx.font = '13px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const topY = 146 + Math.min(lines.length, 3) * 26 + 16;
    ctx.fillText(dateStr, 140, topY);
    ctx.fillText(ev.location, 140, topY + 20);

    // Testo invito
    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('Scansiona per', 140, H - 110);
    ctx.fillText('condividere le tue foto!', 140, H - 90);

    // QR sulla destra
    const qrSize = 320;
    const qrX = 280 + (W - 280 - qrSize) / 2;
    const qrY = (H - qrSize) / 2;
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    // Bordo arrotondato attorno al QR
    ctx.strokeStyle = '#e8eaf0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const pad = 16;
    ctx.roundRect(qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2, 16);
    ctx.stroke();

    // Testo sotto il QR
    ctx.font = '11px Arial';
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'center';
    ctx.fillText('Valido 3 giorni dopo l\'evento', qrX + qrSize / 2, qrY + qrSize + pad + 18);

    const link = document.createElement('a');
    link.download = `locandina-${ev.slug ?? 'evento'}.png`;
    link.href = poster.toDataURL('image/png');
    link.click();
  }

  copyQrUrl(): void {
    const url = this.qrUploadUrl();
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      this.qrCopied.set(true);
      setTimeout(() => this.qrCopied.set(false), 2000);
    });
  }

  // ── Cover upload ──────────────────────────────────────────────────────

  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.uploadCover(input.files[0]);
    input.value = '';
  }

  onCoverDrop(event: DragEvent): void {
    event.preventDefault();
    const file = Array.from(event.dataTransfer?.files ?? []).find(f => f.type.startsWith('image/'));
    if (file) this.uploadCover(file);
  }

  private uploadCover(file: File): void {
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) { alert(`"${file.name}" supera il limite di 5 MB.`); return; }
    const preview: ImagePreview = { file, preview: URL.createObjectURL(file), uploading: true, url: null, error: false };
    const old = this.coverPreview();
    if (old) URL.revokeObjectURL(old.preview);
    this.coverPreview.set(preview);
    this.eventsService.uploadImages([file]).subscribe({
      next: ({ urls }) => {
        this.coverPreview.update(cp => cp ? { ...cp, uploading: false, url: urls[0] ?? null } : cp);
        this.syncFormImages();
      },
      error: () => this.coverPreview.update(cp => cp ? { ...cp, uploading: false, error: true } : cp),
    });
  }

  removeCover(): void {
    const cp = this.coverPreview();
    if (cp) URL.revokeObjectURL(cp.preview);
    this.coverPreview.set(null);
    this.form.cover = undefined;
  }

  // ── Image upload ──────────────────────────────────────────────────────

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.uploadFiles(Array.from(input.files));
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'));
    if (files.length) this.uploadFiles(files);
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); }

  private uploadFiles(files: File[]): void {
    const MAX_SIZE = 15 * 1024 * 1024;
    files = files.filter(f => {
      if (f.size > MAX_SIZE) { alert(`"${f.name}" supera il limite di 5 MB.`); return false; }
      return true;
    });
    if (!files.length) return;

    const newPreviews: ImagePreview[] = files.map(file => ({
      file, preview: URL.createObjectURL(file), uploading: true, url: null, error: false,
    }));
    this.imagePreviews.update(list => [...list, ...newPreviews]);

    this.eventsService.uploadImages(files).subscribe({
      next: ({ urls }) => {
        this.imagePreviews.update(list => {
          const updated = [...list];
          newPreviews.forEach((p, i) => {
            const idx = updated.indexOf(p);
            if (idx !== -1) updated[idx] = { ...updated[idx], uploading: false, url: urls[i] ?? null };
          });
          return updated;
        });
        this.syncFormImages();
      },
      error: () => {
        this.imagePreviews.update(list =>
          list.map(p => newPreviews.includes(p) ? { ...p, uploading: false, error: true } : p),
        );
      },
    });
  }

  removePreview(index: number): void {
    this.imagePreviews.update(list => {
      const updated = [...list];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
    this.syncFormImages();
  }

  private syncFormImages(): void {
    this.form.images = this.imagePreviews().filter(p => p.url !== null).map(p => p.url!);
    this.form.cover  = this.coverPreview()?.url ?? undefined;
  }

  private clearPreviews(): void {
    this.imagePreviews().forEach(p => URL.revokeObjectURL(p.preview));
    this.imagePreviews.set([]);
    const cp = this.coverPreview();
    if (cp) URL.revokeObjectURL(cp.preview);
    this.coverPreview.set(null);
  }

  // ── Submit / Delete ───────────────────────────────────────────────────

  submit(): void {
    if (!this.form.name || !this.form.date || !this.form.time || !this.form.location) return;
    this.syncFormImages();
    this.saving.set(true);
    this.eventsService.create(this.form).subscribe({
      next: evt => {
        this.events.update(list =>
          [...list, evt].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        );
        this.saving.set(false);
        this.closeCreate();

        if (evt.uploadUrl) {
          const origin = this.lanUrl() ?? window.location.origin;
          const fullUrl = `${origin}${evt.uploadUrl}`;
          this.qrUploadUrl.set(fullUrl);
          this.detailEvent.set(evt);
          this.detailTab.set('photos');
          this.loadPhotos(evt.slug ?? '');
          setTimeout(() => this.drawBrandedQr(fullUrl, evt.name), 50);
        }
      },
      error: () => this.saving.set(false),
    });
  }

  deleteEvent(id: string): void {
    this.deleting.set(id);
    this.eventsService.delete(id).subscribe({
      next: () => {
        this.events.update(list => list.filter(e => e.id !== id));
        this.deleting.set(null);
        if (this.detailEvent()?.id === id) this.closeDetail();
      },
      error: () => this.deleting.set(null),
    });
  }

  // ── Format helpers ────────────────────────────────────────────────────

  formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  formatShortDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  toDate(isoDate: string): Date { return new Date(isoDate); }

  shortMonth(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('it-IT', { month: 'short' });
  }

  isPast(isoDate: string): boolean {
    return new Date(isoDate) < new Date(new Date().toDateString());
  }
}

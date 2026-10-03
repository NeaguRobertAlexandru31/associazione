import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CalendarEvent, CreateEventDto, EventPhoto, EventRsvp, RsvpStats } from '../../../../core/models/event.model';
import { EventsService } from '../../../../core/services/events/events';
import { environment } from '../../../../../environments/environment';

export interface ImagePreview {
  file:      File;
  preview:   string;
  uploading: boolean;
  url:       string | null;
  error:     boolean;
}

type DetailTab = 'info' | 'rsvp' | 'photos';

@Component({
  selector: 'app-event-calendar',
  imports: [FormsModule, DatePipe],
  templateUrl: './event-calendar.html',
  styleUrl: './event-calendar.css',
})
export class EventCalendar implements OnInit {
  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;

  private eventsService = inject(EventsService);
  private http          = inject(HttpClient);

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

  imagePreviews = signal<ImagePreview[]>([]);
  coverPreview  = signal<ImagePreview | null>(null);
  form: CreateEventDto = { name: '', date: '', time: '', location: '', description: '', images: [], cover: undefined };

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
    this.form = { name: '', date: '', time: '', location: '', description: '', images: [], cover: undefined };
    this.clearPreviews();
    this.showCreateModal.set(true);
  }

  closeCreate(): void {
    this.showCreateModal.set(false);
    this.clearPreviews();
  }

  openDetail(evt: CalendarEvent): void {
    this.detailEvent.set(evt);
    this.detailTab.set('info');
    this.detailRsvps.set([]);
    this.eventPhotos.set([]);
    // Ripristina QR salvato se presente
    if (evt.uploadUrl) {
      const fullUrl = `${window.location.origin}${evt.uploadUrl}`;
      this.qrUploadUrl.set(fullUrl);
    } else {
      this.qrUploadUrl.set(null);
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
      // Ridisegna il QR se già presente
      const url = this.qrUploadUrl();
      if (url) setTimeout(() => this.drawBrandedQr(url, ev.name), 50);
    }
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
      const fullUrl = `${window.location.origin}${ev.uploadUrl}`;
      this.qrUploadUrl.set(fullUrl);
      setTimeout(() => this.drawBrandedQr(fullUrl, ev.name), 50);
      return;
    }

    this.qrLoading.set(true);
    this.eventsService.getUploadToken(ev.slug).subscribe({
      next: ({ uploadUrl }) => {
        const fullUrl = `${window.location.origin}${uploadUrl}`;
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

    const QRCodeLib = await import('qrcode');

    // Step 1: leggi matrice dal QR su canvas probe
    const PROBE = 200;
    const probe = document.createElement('canvas');
    await QRCodeLib.toCanvas(probe, url, { width: PROBE, margin: 0, color: { dark: '#000000', light: '#ffffff' } });
    const pCtx  = probe.getContext('2d')!;
    const pixels = pCtx.getImageData(0, 0, PROBE, PROBE).data;

    // Trova dimensione cella: primo pixel scuro nella prima riga
    let cellPx = 1;
    for (let x = 0; x < PROBE; x++) {
      if (pixels[x * 4] < 128) { cellPx = x; break; }
    }
    if (cellPx < 1) cellPx = 1;
    const N = Math.round(PROBE / cellPx);

    const grid: boolean[][] = [];
    for (let r = 0; r < N; r++) {
      grid[r] = [];
      for (let c = 0; c < N; c++) {
        const py = Math.floor((r + 0.5) * cellPx);
        const px = Math.floor((c + 0.5) * cellPx);
        grid[r][c] = pixels[(py * PROBE + px) * 4] < 128;
      }
    }

    // Step 2: disegna
    const SIZE  = 320;
    const PAD   = 18;  // padding esterno
    const inner = SIZE - PAD * 2;
    const cell  = inner / N;
    const mr    = cell * 0.32; // raggio angoli moduli normali

    canvas.width  = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;

    // Sfondo con bordo arrotondato
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(0, 0, SIZE, SIZE, 20);
    ctx.fill();

    // Helper: disegna rettangolo arrotondato
    const fillRR = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
    };

    // Finder pattern (i 3 quadrati angolo) — disegnati a mano con stile
    const drawFinder = (row: number, col: number) => {
      const x = PAD + col * cell;
      const y = PAD + row * cell;
      const outerS = cell * 7;
      const innerS = cell * 3;
      const gap    = cell * 2;

      // Anello esterno
      ctx.fillStyle = '#1a2e5a';
      fillRR(x, y, outerS, outerS, cell * 1.4);

      // Buco bianco
      ctx.fillStyle = '#ffffff';
      fillRR(x + cell, y + cell, outerS - cell * 2, outerS - cell * 2, cell * 0.8);

      // Quadrato interno
      ctx.fillStyle = '#1a2e5a';
      fillRR(x + gap, y + gap, innerS, innerS, cell * 0.7);
    };

    drawFinder(0, 0);
    drawFinder(0, N - 7);
    drawFinder(N - 7, 0);

    // Zona finder da escludere (più timing pattern)
    const isFinder = (r: number, c: number) =>
      (r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8);

    // Zona badge centrale da escludere
    const cx      = SIZE / 2;
    const cy      = SIZE / 2;
    const badgeR  = cell * 2.6;
    const centerM = (N - 1) / 2;
    const isBadge = (r: number, c: number) =>
      Math.hypot(r - centerM, c - centerM) < badgeR / cell + 0.5;

    // Moduli dati
    ctx.fillStyle = '#1a2e5a';
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!grid[r][c]) continue;
        if (isFinder(r, c)) continue;
        if (isBadge(r, c)) continue;
        const x = PAD + c * cell;
        const y = PAD + r * cell;
        const s = cell * 0.78;
        const o = (cell - s) / 2;
        fillRR(x + o, y + o, s, s, mr);
      }
    }

    // Badge centrale: cerchio bianco + cerchio blu + testo
    ctx.beginPath();
    ctx.arc(cx, cy, badgeR + 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = '#1a2e5a';
    ctx.fill();

    ctx.font = `bold ${Math.round(cell * 1.05)}px Arial`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A.C.R.', cx, cy);
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
    ctx.fillText('A.C.R.', 140, 48);

    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('Associazione Culturale', 140, 80);
    ctx.fillText('Romena', 140, 98);

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

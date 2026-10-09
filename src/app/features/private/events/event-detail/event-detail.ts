import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Booking, CalendarEvent, CreateEventDto, EventPhoto, EventRsvp, RsvpStats } from '../../../../core/models/event.model';
import { EventsService } from '../../../../core/services/events/events';
import { ImagePreview } from '../../../../shared/components/private/event-calendar/event-calendar';
import { BookingScanner } from '../booking-scanner/booking-scanner';
import { DatePicker } from '../../../../shared/components/private/date-picker/date-picker';
import { TimePicker } from '../../../../shared/components/private/time-picker/time-picker';
import { LocationAutocomplete } from '../../../../shared/components/private/location-autocomplete/location-autocomplete';
import { environment } from '../../../../../environments/environment';

type DetailTab = 'rsvp' | 'photos' | 'bookings';
type EditField = 'name' | 'date' | 'time' | 'location' | 'description' | 'accessType' | 'cover' | 'images' | null;


@Component({
  selector: 'app-event-detail',
  imports: [FormsModule, DatePipe, BookingScanner, DatePicker, TimePicker, LocationAutocomplete],
  templateUrl: './event-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDetail implements OnInit {
  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;

  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private svc    = inject(EventsService);

  // ── Dati evento ──────────────────────────────────────────────────────────
  event    = signal<CalendarEvent | null>(null);
  loading  = signal(true);
  notFound = signal(false);
  deleting = signal(false);

  // ── Modifica inline ───────────────────────────────────────────────────────
  editField  = signal<EditField>(null);
  editValue  = signal<string>('');
  editSaving = signal(false);
  editAccessType = signal<'public' | 'limited' | 'members_only'>('public');
  editCapacity   = signal<number | undefined>(undefined);

  // ── Tab admin ─────────────────────────────────────────────────────────────
  activeTab   = signal<DetailTab>('rsvp');
  showScanner = signal(false);

  // ── RSVP ──────────────────────────────────────────────────────────────────
  rsvpList    = signal<EventRsvp[]>([]);
  rsvpStats   = signal<RsvpStats | null>(null);
  rsvpLoading = signal(false);

  // ── Foto ──────────────────────────────────────────────────────────────────
  eventPhotos      = signal<EventPhoto[]>([]);
  photosLoading    = signal(false);
  photoDeletingId  = signal<string | null>(null);
  photoApprovingId = signal<string | null>(null);
  pendingPhotos    = computed(() => this.eventPhotos().filter(p => !p.approved));
  approvedPhotos   = computed(() => this.eventPhotos().filter(p => p.approved));

  // ── QR ────────────────────────────────────────────────────────────────────
  qrUploadUrl = signal<string | null>(null);
  qrLoading   = signal(false);
  qrCopied    = signal(false);

  // ── Prenotazioni ──────────────────────────────────────────────────────────
  bookings          = signal<Booking[]>([]);
  bookingsLoading   = signal(false);
  bookingsCapacity  = signal<number | null>(null);
  bookingsOccupied  = signal(0);
  bookingsAvailable = signal(0);
  confirmedBookings = computed(() => this.bookings().filter(b => b.status === 'confirmed'));
  waitlistBookings  = computed(() => this.bookings().filter(b => b.status === 'waitlist'));

  // ── Upload immagini ───────────────────────────────────────────────────────
  imagePreviews  = signal<ImagePreview[]>([]);
  imageUploading = signal(false);

  // ── Lightbox ──────────────────────────────────────────────────────────────
  lightboxIndex = signal<number | null>(null);

  // ── Modalità creazione ────────────────────────────────────────────────────
  isCreateMode = signal(false);
  createSaving = signal(false);
  newForm: CreateEventDto & { description: string; accessType: 'public' | 'limited' | 'members_only'; images: string[] } = { name: '', date: '', time: '', location: '', description: '', accessType: 'public', capacity: undefined, cover: undefined, images: [] };
  newCoverPreview  = signal<ImagePreview | null>(null);
  newImagePreviews = signal<ImagePreview[]>([]);
  readonly newAllUploaded = computed(() =>
    this.newImagePreviews().every(p => p.url !== null || p.error) &&
    (this.newCoverPreview() === null || this.newCoverPreview()!.url !== null || this.newCoverPreview()!.error),
  );

  readonly isPast = computed(() => {
    const ev = this.event();
    return ev ? new Date(ev.date) < new Date(new Date().toDateString()) : false;
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    if (slug === 'new') {
      this.isCreateMode.set(true);
      this.loading.set(false);
      return;
    }
    this.svc.getBySlug(slug).subscribe({
      next: ev => {
        this.event.set(ev);
        this.loading.set(false);
        this.svc.getRsvpStats(ev.id).subscribe({ next: s => this.rsvpStats.set(s), error: () => {} });
        if (ev.uploadUrl) this.qrUploadUrl.set(`${window.location.origin}${ev.uploadUrl}`);
        this.loadRsvp(ev.id);
      },
      error: () => { this.notFound.set(true); this.loading.set(false); },
    });
  }

  goBack(): void { this.router.navigate(['/dashboard/events']); }

  // ── Creazione nuovo evento ─────────────────────────────────────────────────
  onNewCoverSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    input.value = '';
    const preview: ImagePreview = { file, preview: URL.createObjectURL(file), uploading: true, url: null, error: false };
    const old = this.newCoverPreview();
    if (old) URL.revokeObjectURL(old.preview);
    this.newCoverPreview.set(preview);
    this.svc.uploadImages([file]).subscribe({
      next: ({ urls }) => {
        this.newCoverPreview.update(cp => cp ? { ...cp, uploading: false, url: urls[0] ?? null } : cp);
        this.newForm.cover = urls[0] ?? undefined;
      },
      error: () => this.newCoverPreview.update(cp => cp ? { ...cp, uploading: false, error: true } : cp),
    });
  }

  onNewCoverDrop(e: DragEvent): void {
    e.preventDefault();
    const file = Array.from(e.dataTransfer?.files ?? []).find(f => f.type.startsWith('image/'));
    if (!file) return;
    const input = { files: [file] } as unknown as HTMLInputElement;
    this.onNewCoverSelected({ target: input } as unknown as Event);
  }

  removeNewCover(): void {
    const cp = this.newCoverPreview();
    if (cp) URL.revokeObjectURL(cp.preview);
    this.newCoverPreview.set(null);
    this.newForm.cover = undefined;
  }

  onNewImagesSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    const files = Array.from(input.files);
    input.value = '';
    const newPreviews: ImagePreview[] = files.map(f => ({ file: f, preview: URL.createObjectURL(f), uploading: true, url: null, error: false }));
    this.newImagePreviews.update(list => [...list, ...newPreviews]);
    this.svc.uploadImages(files).subscribe({
      next: ({ urls }) => {
        this.newImagePreviews.update(list => {
          const updated = [...list];
          newPreviews.forEach((p, i) => {
            const idx = updated.indexOf(p);
            if (idx !== -1) updated[idx] = { ...updated[idx], uploading: false, url: urls[i] ?? null };
          });
          return updated;
        });
        this.newForm.images = this.newImagePreviews().filter(p => p.url).map(p => p.url!);
      },
      error: () => this.newImagePreviews.update(list => list.map(p => newPreviews.includes(p) ? { ...p, uploading: false, error: true } : p)),
    });
  }

  onNewImagesDrop(e: DragEvent): void {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    const syntheticEvent = { target: { files, value: '' } } as unknown as Event;
    this.onNewImagesSelected(syntheticEvent);
  }

  removeNewPreview(index: number): void {
    this.newImagePreviews.update(list => {
      const updated = [...list];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
    this.newForm.images = this.newImagePreviews().filter(p => p.url).map(p => p.url!);
  }

  submitNew(): void {
    const f = this.newForm;
    if (!f.name || !f.date || !f.time || !f.location) return;
    this.createSaving.set(true);
    const dto: CreateEventDto = {
      name: f.name.trim(),
      date: f.date,
      time: f.time,
      location: f.location.trim(),
      description: f.description.trim() || undefined,
      accessType: f.accessType as CreateEventDto['accessType'],
      capacity: f.accessType === 'limited' ? f.capacity : undefined,
      cover: f.cover,
      images: f.images,
    };
    this.svc.create(dto).subscribe({
      next: evt => this.router.navigate(['/dashboard/events', evt.slug]),
      error: () => this.createSaving.set(false),
    });
  }

  // ── Modifica inline ───────────────────────────────────────────────────────
  startEdit(field: EditField): void {
    const ev = this.event();
    if (!ev) return;
    this.editField.set(field);
    switch (field) {
      case 'name':        this.editValue.set(ev.name); break;
      case 'date':        this.editValue.set(ev.date.slice(0, 10)); break;
      case 'time':        this.editValue.set(ev.time); break;
      case 'location':    this.editValue.set(ev.location); break;
      case 'description': this.editValue.set(ev.description ?? ''); break;
      case 'accessType':
        this.editAccessType.set(ev.accessType ?? 'public');
        this.editCapacity.set(ev.capacity ?? undefined);
        break;
    }
  }

  cancelEdit(): void { this.editField.set(null); }

  saveEdit(): void {
    const ev    = this.event();
    const field = this.editField();
    if (!ev || !field) return;

    let dto: Partial<CreateEventDto> = {};
    switch (field) {
      case 'name':        dto = { name: this.editValue().trim() }; break;
      case 'date':        dto = { date: this.editValue() }; break;
      case 'time':        dto = { time: this.editValue() }; break;
      case 'location':    dto = { location: this.editValue().trim() }; break;
      case 'description': dto = { description: this.editValue().trim() || undefined }; break;
      case 'accessType':
        dto = { accessType: this.editAccessType() };
        if (this.editAccessType() === 'limited') dto.capacity = this.editCapacity();
        break;
    }

    this.editSaving.set(true);
    this.svc.update(ev.id, dto).subscribe({
      next: updated => { this.event.set(updated); this.editField.set(null); this.editSaving.set(false); },
      error: ()      => this.editSaving.set(false),
    });
  }

  // ── Cover ─────────────────────────────────────────────────────────────────
  onCoverSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    input.value = '';
    this.svc.uploadImages([file]).subscribe({
      next: ({ urls }) => {
        const url = urls[0];
        if (!url) return;
        const ev = this.event();
        if (!ev) return;
        this.svc.update(ev.id, { cover: url }).subscribe({ next: u => this.event.set(u), error: () => {} });
      },
    });
  }

  // ── Gallery ───────────────────────────────────────────────────────────────
  onImagesSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    const files = Array.from(input.files);
    input.value = '';
    this.imageUploading.set(true);
    this.svc.uploadImages(files).subscribe({
      next: ({ urls }) => {
        this.imageUploading.set(false);
        const ev = this.event();
        if (!ev) return;
        const allUrls = [...ev.images, ...urls.filter(Boolean)];
        this.svc.update(ev.id, { images: allUrls }).subscribe({ next: u => this.event.set(u), error: () => {} });
      },
      error: () => this.imageUploading.set(false),
    });
  }

  removeImage(url: string): void {
    const ev = this.event();
    if (!ev) return;
    const images = ev.images.filter(i => i !== url);
    this.svc.update(ev.id, { images }).subscribe({ next: u => this.event.set(u), error: () => {} });
  }

  // ── Tab ───────────────────────────────────────────────────────────────────
  switchTab(tab: DetailTab): void {
    this.activeTab.set(tab);
    const ev = this.event();
    if (!ev) return;
    if (tab === 'rsvp') this.loadRsvp(ev.id);
    if (tab === 'photos') {
      this.loadPhotos(ev.slug ?? '');
      if (this.qrUploadUrl()) setTimeout(() => this.drawBrandedQr(this.qrUploadUrl()!, ev.name), 50);
    }
    if (tab === 'bookings') this.loadBookings(ev.slug ?? '');
  }

  private loadRsvp(eventId: string): void {
    this.rsvpLoading.set(true);
    this.svc.getRsvpList(eventId).subscribe({
      next: list => { this.rsvpList.set(list); this.rsvpLoading.set(false); },
      error: ()   => this.rsvpLoading.set(false),
    });
  }

  private loadPhotos(slug: string): void {
    this.photosLoading.set(true);
    this.svc.getEventPhotosAdmin(slug).subscribe({
      next: photos => { this.eventPhotos.set(photos); this.photosLoading.set(false); },
      error: ()    => this.photosLoading.set(false),
    });
  }

  private loadBookings(slug: string): void {
    this.bookingsLoading.set(true);
    this.svc.getBookingsAdmin(slug).subscribe({
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

  // ── Foto admin ────────────────────────────────────────────────────────────
  approvePhoto(photoId: string): void {
    const ev = this.event();
    if (!ev) return;
    this.photoApprovingId.set(photoId);
    this.svc.approvePhoto(ev.slug ?? '', photoId).subscribe({
      next: updated => { this.eventPhotos.update(list => list.map(p => p.id === photoId ? updated : p)); this.photoApprovingId.set(null); },
      error: () => this.photoApprovingId.set(null),
    });
  }

  deletePhoto(photoId: string): void {
    const ev = this.event();
    if (!ev) return;
    this.photoDeletingId.set(photoId);
    this.svc.deletePhoto(ev.slug ?? '', photoId).subscribe({
      next: () => { this.eventPhotos.update(list => list.filter(p => p.id !== photoId)); this.photoDeletingId.set(null); },
      error: () => this.photoDeletingId.set(null),
    });
  }

  // ── QR ────────────────────────────────────────────────────────────────────
  generateQr(): void {
    const ev = this.event();
    if (!ev?.slug) return;
    if (ev.uploadUrl) {
      const url = `${window.location.origin}${ev.uploadUrl}`;
      this.qrUploadUrl.set(url);
      setTimeout(() => this.drawBrandedQr(url, ev.name), 50);
      return;
    }
    this.qrLoading.set(true);
    this.svc.getUploadToken(ev.slug).subscribe({
      next: ({ uploadUrl }) => {
        const url = `${window.location.origin}${uploadUrl}`;
        this.qrUploadUrl.set(url);
        this.event.update(e => e ? { ...e, uploadUrl } : e);
        this.qrLoading.set(false);
        setTimeout(() => this.drawBrandedQr(url, ev.name), 50);
      },
      error: () => this.qrLoading.set(false),
    });
  }

  async drawBrandedQr(url: string, _name: string): Promise<void> {
    const canvas = this.qrCanvas?.nativeElement;
    if (!canvas) return;
    const SIZE = 280;
    const { default: QRCodeStyling } = await import('qr-code-styling');
    const qr = new QRCodeStyling({
      width: SIZE, height: SIZE, type: 'canvas', data: url, margin: 10,
      qrOptions: { errorCorrectionLevel: 'H' },
      dotsOptions: { type: 'rounded', color: '#1a2e5a' },
      cornersSquareOptions: { type: 'extra-rounded', color: '#1a2e5a' },
      cornersDotOptions: { type: 'dot', color: '#1a2e5a' },
      backgroundOptions: { color: '#ffffff' },
      image: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><circle cx="30" cy="30" r="30" fill="#1a2e5a"/><text x="30" y="35" font-family="Arial" font-weight="bold" font-size="13" fill="white" text-anchor="middle">APS</text></svg>`),
      imageOptions: { hideBackgroundDots: true, imageSize: 0.28, margin: 4, crossOrigin: 'anonymous' },
    });
    const blob = await qr.getRawData('png');
    if (!blob) return;
    const bmp = await createImageBitmap(blob as Blob);
    canvas.width = SIZE; canvas.height = SIZE;
    canvas.getContext('2d')!.drawImage(bmp, 0, 0);
  }

  downloadQr(): void {
    const canvas = this.qrCanvas?.nativeElement;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `qr-${this.event()?.slug ?? 'evento'}.png`;
    link.href = canvas.toDataURL('image/png');
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

  // ── Delete evento ─────────────────────────────────────────────────────────
  deleteEvent(): void {
    const ev = this.event();
    if (!ev || !confirm(`Eliminare definitivamente "${ev.name}"?`)) return;
    this.deleting.set(true);
    this.svc.delete(ev.id).subscribe({
      next: () => this.router.navigate(['/dashboard/events']),
      error: () => this.deleting.set(false),
    });
  }

  // ── Utility ───────────────────────────────────────────────────────────────
  resolveImg(path: string): string {
    return path.startsWith('http') ? path : `${environment.apiUrl}${path}`;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  shortMonth(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', { month: 'short' });
  }

  toDate(iso: string): Date { return new Date(iso); }

  openLightbox(i: number): void { this.lightboxIndex.set(i); }
  closeLightbox(): void { this.lightboxIndex.set(null); }
  prevImg(len: number): void { this.lightboxIndex.update(i => i !== null ? (i - 1 + len) % len : 0); }
  nextImg(len: number): void { this.lightboxIndex.update(i => i !== null ? (i + 1) % len : 0); }
}

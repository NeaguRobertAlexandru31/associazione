import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarEvent, CreateEventDto } from '../../../../core/models/event.model';
import { EventsService } from '../../../../core/services/events/events';

export interface ImagePreview {
  file:      File;
  preview:   string;
  uploading: boolean;
  url:       string | null;
  error:     boolean;
}

@Component({
  selector: 'app-event-calendar',
  imports: [FormsModule],
  templateUrl: './event-calendar.html',
  styleUrl: './event-calendar.css',
})
export class EventCalendar implements OnInit {
  private eventsService = inject(EventsService);

  events   = signal<CalendarEvent[]>([]);
  loading  = signal(false);
  saving   = signal(false);
  deleting = signal<string | null>(null);

  showCreateModal = signal(false);
  detailEvent     = signal<CalendarEvent | null>(null);

  imagePreviews = signal<ImagePreview[]>([]);
  form: CreateEventDto = { name: '', date: '', time: '', location: '', description: '', images: [] };

  readonly allUploaded = computed(() =>
    this.imagePreviews().every(p => p.url !== null || p.error),
  );

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.eventsService.getAll().subscribe({
      next: evts => { this.events.set(evts); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.form = { name: '', date: '', time: '', location: '', description: '', images: [] };
    this.clearPreviews();
    this.showCreateModal.set(true);
  }

  closeCreate(): void {
    this.showCreateModal.set(false);
    this.clearPreviews();
  }

  openDetail(evt: CalendarEvent): void { this.detailEvent.set(evt); }
  closeDetail(): void { this.detailEvent.set(null); }

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
    const MAX_SIZE = 5 * 1024 * 1024;
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
  }

  private clearPreviews(): void {
    this.imagePreviews().forEach(p => URL.revokeObjectURL(p.preview));
    this.imagePreviews.set([]);
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

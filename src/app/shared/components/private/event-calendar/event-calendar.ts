import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarEvent, CreateEventDto } from '../../../../core/models/event.model';
import { EventsService } from '../../../../core/services/events/events';

export interface CalendarDay {
  date: Date;
  inMonth: boolean;
}

export interface ImagePreview {
  file: File;
  preview: string; // object URL
  uploading: boolean;
  url: string | null; // server URL after upload
  error: boolean;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

@Component({
  selector: 'app-event-calendar',
  imports: [FormsModule],
  templateUrl: './event-calendar.html',
  styleUrl: './event-calendar.css',
})
export class EventCalendar implements OnInit {
  private eventsService = inject(EventsService);

  readonly weekdays = WEEKDAYS;

  viewDate     = signal(new Date());
  selectedDate = signal<Date | null>(null);
  events       = signal<CalendarEvent[]>([]);
  loading      = signal(false);
  showForm     = signal(false);
  saving       = signal(false);
  deleting     = signal<string | null>(null);
  imagePreviews = signal<ImagePreview[]>([]);

  form: CreateEventDto = { name: '', date: '', time: '', location: '', description: '', images: [] };

  readonly monthLabel = computed(() => {
    const d = this.viewDate();
    return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  });

  readonly calendarDays = computed((): CalendarDay[] => {
    const d     = this.viewDate();
    const year  = d.getFullYear();
    const month = d.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const startPad = (firstDay.getDay() + 6) % 7;

    const days: CalendarDay[] = [];

    for (let i = startPad - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), inMonth: false });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), inMonth: true });
    }
    while (days.length % 7 !== 0) {
      const extra = days.length - lastDay.getDate() - startPad + 1;
      days.push({ date: new Date(year, month + 1, extra), inMonth: false });
    }

    return days;
  });

  readonly eventDatesSet = computed(() => {
    const set = new Set<string>();
    for (const e of this.events()) set.add(dateKey(new Date(e.date)));
    return set;
  });

  readonly selectedDayEvents = computed(() => {
    const sel = this.selectedDate();
    if (!sel) return [];
    const key = dateKey(sel);
    return this.events().filter(e => dateKey(new Date(e.date)) === key);
  });

  readonly todayKey = dateKey(new Date());

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

  prevMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  selectDay(day: CalendarDay): void {
    if (!day.inMonth) return;
    this.selectedDate.set(day.date);
    this.showForm.set(false);
  }

  openForm(): void {
    this.showForm.set(true);
    this.selectedDate.set(null);
    this.form = { name: '', date: '', time: '', location: '', description: '', images: [] };
    this.clearPreviews();
  }

  closeForm(): void {
    this.showForm.set(false);
    this.clearPreviews();
  }

  // ── Image upload ──────────────────────────────────────────────────────

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.uploadFiles(Array.from(input.files));
    input.value = ''; // reset so same file can be re-selected
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files ?? []).filter(f =>
      f.type.startsWith('image/'),
    );
    if (files.length) this.uploadFiles(files);
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); }

  private uploadFiles(files: File[]): void {
    const MAX_SIZE = 5 * 1024 * 1024;
    files = files.filter(f => {
      if (f.size > MAX_SIZE) {
        alert(`"${f.name}" supera il limite di 5 MB e non verrà caricato.`);
        return false;
      }
      return true;
    });
    if (!files.length) return;

    const newPreviews: ImagePreview[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
      url: null,
      error: false,
    }));

    this.imagePreviews.update(list => [...list, ...newPreviews]);

    this.eventsService.uploadImages(files).subscribe({
      next: ({ urls }) => {
        this.imagePreviews.update(list => {
          const updated = [...list];
          newPreviews.forEach((p, i) => {
            const idx = updated.indexOf(p);
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], uploading: false, url: urls[i] ?? null };
            }
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
    this.form.images = this.imagePreviews()
      .filter(p => p.url !== null)
      .map(p => p.url!);
  }

  private clearPreviews(): void {
    this.imagePreviews().forEach(p => URL.revokeObjectURL(p.preview));
    this.imagePreviews.set([]);
  }

  // ── Submit ────────────────────────────────────────────────────────────

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
        this.showForm.set(false);
        this.clearPreviews();
        const d = new Date(evt.date);
        this.viewDate.set(new Date(d.getFullYear(), d.getMonth(), 1));
        this.selectedDate.set(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
      },
      error: () => this.saving.set(false),
    });
  }

  deleteEvent(id: string): void {
    this.deleting.set(id);
    this.eventsService.delete(id).subscribe({
      next: () => { this.events.update(list => list.filter(e => e.id !== id)); this.deleting.set(null); },
      error: () => this.deleting.set(null),
    });
  }

  selectEvent(evt: CalendarEvent): void {
    const d = new Date(evt.date);
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth(), 1));
    this.selectedDate.set(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    this.showForm.set(false);
  }

  formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  toDate(isoDate: string): Date { return new Date(isoDate); }

  shortMonth(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('it-IT', { month: 'short' });
  }

  hasEvent(day: CalendarDay): boolean { return this.eventDatesSet().has(dateKey(day.date)); }
  isSelected(day: CalendarDay): boolean {
    const sel = this.selectedDate();
    return !!sel && dateKey(sel) === dateKey(day.date);
  }
  isToday(day: CalendarDay): boolean { return dateKey(day.date) === this.todayKey; }
}

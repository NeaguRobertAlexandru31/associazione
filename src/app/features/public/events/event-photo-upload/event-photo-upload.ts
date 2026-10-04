import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { EventsService } from '../../../../core/services/events/events';
import { CalendarEvent, EventPhoto } from '../../../../core/models/event.model';

interface PhotoPreview {
  file: File;
  objectUrl: string;
  state: 'pending' | 'uploading' | 'done' | 'error';
}

type PageState = 'loading' | 'identify' | 'ready' | 'invalid-token' | 'limit-reached' | 'done';

@Component({
  selector: 'app-event-photo-upload',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './event-photo-upload.html',
})
export class EventPhotoUpload implements OnInit {
  private route = inject(ActivatedRoute);
  private svc   = inject(EventsService);

  pageState      = signal<PageState>('loading');
  event          = signal<CalendarEvent | null>(null);
  token          = signal('');
  previews       = signal<PhotoPreview[]>([]);
  sending        = signal(false);
  errorMsg       = signal('');
  existingPhotos = signal<EventPhoto[]>([]);
  lightboxUrls   = signal<string[]>([]);
  lightboxIndex  = signal<number | null>(null);

  uploaderName  = signal('');
  uploaderEmail = signal('');
  identifyError = signal('');

  readonly pendingCount = computed(() => this.previews().filter(p => p.state === 'pending').length);

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!token) {
      this.pageState.set('invalid-token');
      return;
    }

    this.token.set(token);
    this.svc.getBySlug(slug).subscribe({
      next: ev => {
        this.event.set(ev);
        this.pageState.set('identify');
        this.svc.getPublicPhotos(slug).subscribe({
          next: photos => this.existingPhotos.set(photos),
          error: () => {},
        });
      },
      error: () => this.pageState.set('invalid-token'),
    });
  }

  confirmIdentity() {
    const name  = this.uploaderName().trim();
    const email = this.uploaderEmail().trim();
    if (!name) { this.identifyError.set('Inserisci il tuo nome'); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.identifyError.set('L\'email inserita non è valida'); return;
    }
    this.identifyError.set('');
    this.pageState.set('ready');
  }

  openLightbox(urls: string[], index: number): void {
    this.lightboxUrls.set(urls);
    this.lightboxIndex.set(index);
  }

  closeLightbox(): void { this.lightboxIndex.set(null); }

  prevLightbox(): void {
    const urls = this.lightboxUrls();
    this.lightboxIndex.update(i => i !== null ? (i - 1 + urls.length) % urls.length : 0);
  }

  nextLightbox(): void {
    const urls = this.lightboxUrls();
    this.lightboxIndex.update(i => i !== null ? (i + 1) % urls.length : 0);
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;

    const newPreviews: PhotoPreview[] = files.map(file => ({
      file,
      objectUrl: URL.createObjectURL(file),
      state: 'pending',
    }));
    this.previews.update(list => [...list, ...newPreviews]);
    input.value = '';
  }

  removePhoto(preview: PhotoPreview) {
    URL.revokeObjectURL(preview.objectUrl);
    this.previews.update(list => list.filter(p => p !== preview));
  }

  send() {
    const slug    = this.route.snapshot.paramMap.get('slug') ?? '';
    const token   = this.token();
    const pending = this.previews().filter(p => p.state === 'pending');
    if (!pending.length || this.sending()) return;

    this.sending.set(true);
    this.errorMsg.set('');
    this.previews.update(list =>
      list.map(p => p.state === 'pending' ? { ...p, state: 'uploading' } : p),
    );

    // Step 1: chiedi presigned URL al backend
    this.svc.presignPhotoUploads(slug, token, pending.map(p => p.file), this.uploaderName(), this.uploaderEmail()).subscribe({
      next: async ({ presignedUrls }) => {
        try {
          // Step 2: carica ogni file direttamente su S3
          await Promise.all(
            presignedUrls.map(({ uploadUrl }, i) =>
              fetch(uploadUrl, {
                method: 'PUT',
                body: pending[i].file,
                headers: { 'Content-Type': pending[i].file.type || 'image/jpeg' },
              }).then(r => { if (!r.ok) throw new Error(`S3 upload failed: ${r.status}`); }),
            ),
          );

          // Step 3: notifica il backend per watermark + salvataggio DB
          this.svc.confirmPhotoUploads(
            slug, token,
            presignedUrls.map(p => p.key),
            this.uploaderName(), this.uploaderEmail(),
          ).subscribe({
            next: () => {
              pending.forEach(p => URL.revokeObjectURL(p.objectUrl));
              this.previews.set([]);
              this.sending.set(false);
              this.svc.getPublicPhotos(slug).subscribe({
                next: photos => this.existingPhotos.set(photos),
                error: () => {},
              });
              this.pageState.set('done');
            },
            error: () => {
              this.errorMsg.set('Errore durante il salvataggio. Riprova.');
              this.previews.update(list =>
                list.map(p => p.state === 'uploading' ? { ...p, state: 'error' } : p),
              );
              this.sending.set(false);
            },
          });
        } catch {
          this.errorMsg.set('Errore durante il caricamento. Riprova.');
          this.previews.update(list =>
            list.map(p => p.state === 'uploading' ? { ...p, state: 'error' } : p),
          );
          this.sending.set(false);
        }
      },
      error: (err) => {
        const msg: string = err?.error?.message ?? '';
        if (msg.toLowerCase().includes('limite') || msg.toLowerCase().includes('massimo')) {
          this.pageState.set('limit-reached');
        } else if (err.status === 401) {
          this.pageState.set('invalid-token');
        } else {
          this.errorMsg.set('Errore durante la preparazione. Riprova.');
          this.previews.update(list =>
            list.map(p => p.state === 'uploading' ? { ...p, state: 'error' } : p),
          );
        }
        this.sending.set(false);
      },
    });
  }

  formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }
}

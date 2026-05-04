import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CalendarEvent } from '../../../../core/models/event.model';
import { EventsService } from '../../../../core/services/events/events';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-event-detail',
  imports: [RouterLink],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.css',
})
export class EventDetail implements OnInit {
  private route  = inject(ActivatedRoute);
  private svc    = inject(EventsService);

  event           = signal<CalendarEvent | null>(null);
  loading         = signal(true);
  notFound        = signal(false);
  lightboxIndex   = signal<number | null>(null);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.svc.getBySlug(slug).subscribe({
      next: ev  => { this.event.set(ev);  this.loading.set(false); },
      error: () => { this.notFound.set(true); this.loading.set(false); },
    });
  }

  resolveImg(path: string): string {
    if (path.startsWith('http')) return path;
    return `${environment.apiUrl}${path}`;
  }

  openLightbox(index: number): void { this.lightboxIndex.set(index); }
  closeLightbox(): void              { this.lightboxIndex.set(null); }

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
}

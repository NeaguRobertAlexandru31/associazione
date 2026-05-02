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

  event      = signal<CalendarEvent | null>(null);
  loading    = signal(true);
  notFound   = signal(false);
  lightbox   = signal<string | null>(null); // URL dell'immagine aperta

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.svc.getBySlug(slug).subscribe({
      next: ev  => { this.event.set(ev);  this.loading.set(false); },
      error: () => { this.notFound.set(true); this.loading.set(false); },
    });
  }

  resolveImg(path: string): string { return `${environment.apiUrl}${path}`; }

  openLightbox(url: string): void  { this.lightbox.set(url); }
  closeLightbox(): void             { this.lightbox.set(null); }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }
}

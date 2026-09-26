import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CalendarEvent, CreateEventDto, EventRsvp, RsvpStats } from '../../models/event.model';

@Injectable({ providedIn: 'root' })
export class EventsService {
  private http = inject(HttpClient);

  getAll(): Observable<CalendarEvent[]> {
    return this.http.get<CalendarEvent[]>(`${environment.apiUrl}/events`);
  }

  getBySlug(slug: string): Observable<CalendarEvent> {
    return this.http.get<CalendarEvent>(`${environment.apiUrl}/events/${slug}`);
  }

  uploadImages(files: File[]): Observable<{ urls: string[] }> {
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    return this.http.post<{ urls: string[] }>(`${environment.apiUrl}/uploads/events`, fd);
  }

  create(dto: CreateEventDto): Observable<CalendarEvent> {
    return this.http.post<CalendarEvent>(`${environment.apiUrl}/events`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/events/${id}`);
  }

  rsvp(eventId: string, body: { name: string; email?: string; status: 'attending' | 'interested' }): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/events/${eventId}/rsvp`, body);
  }

  getRsvpStats(eventId: string): Observable<RsvpStats> {
    return this.http.get<RsvpStats>(`${environment.apiUrl}/events/${eventId}/rsvp/stats`);
  }

  getRsvpList(eventId: string): Observable<EventRsvp[]> {
    return this.http.get<EventRsvp[]>(`${environment.apiUrl}/events/${eventId}/rsvp`);
  }
}

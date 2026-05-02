import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CalendarEvent, CreateEventDto } from '../../models/event.model';

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
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CalendarEvent, CreateEventDto, EventPhoto, EventRsvp, RsvpStats } from '../../models/event.model';

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

  getPublicPhotos(slug: string): Observable<EventPhoto[]> {
    return this.http.get<EventPhoto[]>(`${environment.apiUrl}/events/${slug}/photos?approved=true`);
  }

  uploadPhotoPublic(slug: string, token: string, files: File[], uploaderName: string, uploaderEmail: string): Observable<{ uploaded: number }> {
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    fd.append('uploaderName', uploaderName);
    fd.append('uploaderEmail', uploaderEmail);
    return this.http.post<{ uploaded: number }>(
      `${environment.apiUrl}/events/${slug}/photos/upload`,
      fd,
      { headers: { 'x-upload-token': token } },
    );
  }

  getEventPhotosAdmin(slug: string): Observable<EventPhoto[]> {
    return this.http.get<EventPhoto[]>(`${environment.apiUrl}/events/${slug}/photos`);
  }

  approvePhoto(slug: string, photoId: string): Observable<EventPhoto> {
    return this.http.patch<EventPhoto>(`${environment.apiUrl}/events/${slug}/photos/${photoId}/approve`, {});
  }

  deletePhoto(slug: string, photoId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/events/${slug}/photos/${photoId}`);
  }

  getUploadToken(slug: string): Observable<{ token: string; uploadUrl: string }> {
    return this.http.get<{ token: string; uploadUrl: string }>(`${environment.apiUrl}/events/${slug}/photos/upload-token`);
  }

  getShareLink(slug: string): Observable<{ token: string; uploadUrl: string }> {
    return this.http.get<{ token: string; uploadUrl: string }>(`${environment.apiUrl}/events/${slug}/photos/share-link`);
  }
}

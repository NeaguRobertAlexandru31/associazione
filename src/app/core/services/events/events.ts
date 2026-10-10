import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Booking, BookingAvailability, CalendarEvent, CreateEventDto, EventPhoto, EventRsvp, RsvpStats } from '../../models/event.model';

@Injectable({ providedIn: 'root' })
export class EventsService {
  private http = inject(HttpClient);

  getAll(): Observable<CalendarEvent[]> {
    return this.http.get<CalendarEvent[]>(`${environment.apiUrl}/events`);
  }

  getBySlug(slug: string): Observable<CalendarEvent> {
    return this.http.get<CalendarEvent>(`${environment.apiUrl}/events/${slug}`);
  }

  uploadImages(files: File[], folder = 'events'): Observable<{ urls: string[] }> {
    // Presign → upload diretto su S3 → process (resize+webp+watermark)
    return this.http.post<{ presignedUrls: { uploadUrl: string; key: string }[] }>(
      `${environment.apiUrl}/uploads/presign`,
      { folder, files: files.map(f => ({ name: f.name, type: f.type || 'image/jpeg' })) },
    ).pipe(
      switchMap(({ presignedUrls }) =>
        new Observable<{ urls: string[] }>(observer => {
          Promise.all(
            presignedUrls.map(({ uploadUrl }, i) =>
              fetch(uploadUrl, {
                method: 'PUT',
                body: files[i],
                headers: { 'Content-Type': files[i].type || 'image/jpeg' },
              }).then(r => { if (!r.ok) throw new Error(`S3 ${r.status}`); }),
            ),
          ).then(() => {
            this.http.post<{ urls: string[] }>(
              `${environment.apiUrl}/uploads/process`,
              { folder, keys: presignedUrls.map(p => p.key), watermark: true },
            ).subscribe({ next: v => { observer.next(v); observer.complete(); }, error: e => observer.error(e) });
          }).catch(e => observer.error(e));
        }),
      ),
    );
  }

  create(dto: CreateEventDto): Observable<CalendarEvent> {
    return this.http.post<CalendarEvent>(`${environment.apiUrl}/events`, dto);
  }

  update(id: string, dto: Partial<CreateEventDto>): Observable<CalendarEvent> {
    return this.http.patch<CalendarEvent>(`${environment.apiUrl}/events/${id}`, dto);
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

  presignPhotoUploads(slug: string, token: string, files: File[], uploaderName: string, uploaderEmail: string): Observable<{ presignedUrls: { uploadUrl: string; key: string }[] }> {
    return this.http.post<{ presignedUrls: { uploadUrl: string; key: string }[] }>(
      `${environment.apiUrl}/events/${slug}/photos/presign`,
      { uploaderName, uploaderEmail, files: files.map(f => ({ name: f.name, type: f.type || 'image/jpeg' })) },
      { headers: { 'x-upload-token': token } },
    );
  }

  confirmPhotoUploads(slug: string, token: string, keys: string[], uploaderName: string, uploaderEmail: string): Observable<{ uploaded: number }> {
    return this.http.post<{ uploaded: number }>(
      `${environment.apiUrl}/events/${slug}/photos/confirm`,
      { uploaderName, uploaderEmail, keys },
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

  getUploadToken(slug: string, force = false): Observable<{ token: string; uploadUrl: string }> {
    const params = force ? '?force=true' : '';
    return this.http.get<{ token: string; uploadUrl: string }>(`${environment.apiUrl}/events/${slug}/photos/upload-token${params}`);
  }

  getShareLink(slug: string): Observable<{ token: string; uploadUrl: string }> {
    return this.http.get<{ token: string; uploadUrl: string }>(`${environment.apiUrl}/events/${slug}/photos/share-link`);
  }

  getAvailability(slug: string): Observable<BookingAvailability> {
    return this.http.get<BookingAvailability>(`${environment.apiUrl}/events/${slug}/availability`);
  }

  book(slug: string, dto: { name: string; email: string; phone?: string; seats: number; guests?: { name: string; email?: string; phone?: string }[] }): Observable<{ status: 'confirmed' | 'waitlist'; position?: number; bookingId: string }> {
    return this.http.post<{ status: 'confirmed' | 'waitlist'; position?: number; bookingId: string }>(`${environment.apiUrl}/events/${slug}/book`, dto);
  }

  getBookingsAdmin(slug: string): Observable<{ bookings: Booking[]; capacity: number; occupied: number; available: number }> {
    return this.http.get<{ bookings: Booking[]; capacity: number; occupied: number; available: number }>(`${environment.apiUrl}/events/${slug}/bookings`);
  }

  cancelBooking(cancelToken: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/bookings/cancel/${cancelToken}`);
  }

  verifyBooking(bookingId: string): Observable<{
    valid: boolean;
    id: string;
    name: string;
    email: string;
    seats: number;
    status: string;
    eventName: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    createdAt: string;
  }> {
    return this.http.get<any>(`${environment.apiUrl}/bookings/verify/${bookingId}`);
  }
}

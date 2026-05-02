import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface SendContactDto {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/contact`;

  send(dto: SendContactDto): Observable<ContactMessage> {
    return this.http.post<ContactMessage>(this.base, dto);
  }

  getAll(): Observable<ContactMessage[]> {
    return this.http.get<ContactMessage[]>(this.base);
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.base}/unread-count`);
  }

  markRead(id: string): Observable<ContactMessage> {
    return this.http.patch<ContactMessage>(`${this.base}/${id}/read`, {});
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DocScanToken {
  id: string;
  token: string;
  label: string | null;
  usedAt: string | null;
  submittedBy: string | null;
  submittedEmail: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  expiresAt: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class DocScanService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/doc-scan`;

  validate(token: string): Observable<DocScanToken> {
    return this.http.get<DocScanToken>(`${this.base}/validate`, { params: { token } });
  }

  presign(token: string, contentType: string): Observable<{ uploadUrl: string; key: string }> {
    return this.http.post<{ uploadUrl: string; key: string }>(`${this.base}/presign?token=${token}`, { contentType });
  }

  submit(token: string, data: { name: string; email?: string; fileUrl: string; fileName: string; fileSize: number }): Observable<DocScanToken> {
    return this.http.post<DocScanToken>(`${this.base}/submit?token=${token}`, data);
  }

  getTokens(): Observable<DocScanToken[]> {
    return this.http.get<DocScanToken[]>(`${this.base}/tokens`);
  }

  createToken(label?: string): Observable<DocScanToken> {
    return this.http.post<DocScanToken>(`${this.base}/token`, { label });
  }

  deleteToken(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/token/${id}`);
  }
}

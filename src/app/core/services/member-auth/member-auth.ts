import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SocioMemberDetail } from '../../models/member.model';

export interface UpdateMemberMeRequest {
  firstName?: string;
  lastName?: string;
  fiscalCode?: string;
  birthDate?: string;
  birthPlace?: string;
  gender?: string;
  docType?: string;
  docNumber?: string;
  docExpiry?: string;
  email?: string;
  phone?: string;
  addressStreet?: string;
  addressZip?: string;
  addressCity?: string;
  addressProvince?: string;
  privacyNewsletter?: boolean;
  privacyThirdParties?: boolean;
}

const TOKEN_KEY = 'acr_member_token';
const API       = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class MemberAuthService {
  private http = inject(HttpClient);

  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly isLoggedIn = () => !!this._token();

  getToken(): string | null { return this._token(); }

  private headers(): { headers: HttpHeaders } {
    return { headers: new HttpHeaders({ Authorization: `Bearer ${this._token()}` }) };
  }

  checkEmail(email: string): Observable<{ exists: boolean; hasPassword: boolean }> {
    return this.http.post<{ exists: boolean; hasPassword: boolean }>(`${API}/member-auth/check-email`, { email });
  }

  setPassword(email: string, password: string): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${API}/member-auth/set-password`, { email, password });
  }

  login(email: string, password: string): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${API}/member-auth/login`, { email, password });
  }

  persistToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this._token.set(token);
  }

  getMe(): Observable<SocioMemberDetail> {
    return this.http.get<SocioMemberDetail>(`${API}/member-auth/me`, this.headers());
  }

  updateMe(dto: UpdateMemberMeRequest): Observable<SocioMemberDetail> {
    return this.http.patch<SocioMemberDetail>(`${API}/member-auth/me`, dto, this.headers());
  }

  uploadAvatar(file: File): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ url: string }>(`${API}/member-auth/avatar`, form, this.headers());
  }

  deleteMe(): Observable<void> {
    return this.http.delete<void>(`${API}/member-auth/me`, this.headers());
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this._token.set(null);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { InviteResponse } from '../../models/invite.model';
import { LoginRequest, LoginResponse } from '../../models/login.model';
import { SocioMemberDetail } from '../../models/member.model';
import { RegisterRequest, RegisterResponse } from '../../models/register.model';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface UpdateMyMemberRequest {
  phone?: string;
  addressStreet?: string;
  addressZip?: string;
  addressCity?: string;
  addressProvince?: string;
  privacyNewsletter?: boolean;
  privacyThirdParties?: boolean;
}

const TOKEN_KEY = 'acr_token';
const USER_KEY  = 'acr_user';
const API_URL   = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private _user  = signal<AuthUser | null>(this.restoreUser());

  readonly isLoggedIn   = computed(() => !!this._token());
  readonly user         = this._user.asReadonly();
  readonly isSuperAdmin = computed(() => this._user()?.role === 'SUPERADMIN');

  private restoreUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  getToken(): string | null {
    return this._token();
  }

  login(dto: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, dto).pipe(
      tap(res => this.persist(res)),
    );
  }

  register(dto: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${API_URL}/auth/register`, dto).pipe(
      tap(res => this.persist(res)),
    );
  }

  checkMember(email: string): Observable<{ isMember: boolean }> {
    return this.http.post<{ isMember: boolean }>(`${API_URL}/auth/check-member`, { email });
  }

  createInvite(): Observable<InviteResponse> {
    return this.http.post<InviteResponse>(`${API_URL}/auth/invite`, {});
  }

  getProfile(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${API_URL}/auth/me`);
  }

  updateProfile(dto: { name?: string; email?: string; password?: string; currentPassword?: string }): Observable<LoginResponse> {
    return this.http.patch<LoginResponse>(`${API_URL}/auth/me`, dto).pipe(
      tap(res => this.persist(res)),
    );
  }

  deleteProfile(currentPassword: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/auth/me`, { body: { currentPassword } });
  }

  // ── Area personale socio ───────────────────────────────────────────────

  getMyMember(): Observable<SocioMemberDetail | null> {
    return this.http.get<SocioMemberDetail | null>(`${API_URL}/auth/me/member`);
  }

  updateMyMember(dto: UpdateMyMemberRequest): Observable<SocioMemberDetail> {
    return this.http.patch<SocioMemberDetail>(`${API_URL}/auth/me/member`, dto);
  }

  deleteMyMember(): Observable<void> {
    return this.http.delete<void>(`${API_URL}/auth/me/member`);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
  }

  private persist(res: LoginResponse | RegisterResponse): void {
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.admin));
    this._token.set(res.access_token);
    this._user.set(res.admin as AuthUser);
  }
}

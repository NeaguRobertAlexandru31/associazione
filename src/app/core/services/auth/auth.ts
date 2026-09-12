import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthUser, MemberDetail, TesseraInfo, UpdateMemberRequest, UserRole } from '../../models/member.model';
import { LoginRequest, LoginResponse } from '../../models/login.model';

const TOKEN_KEY = 'acr_token';
const USER_KEY  = 'acr_user';
const API       = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private _user  = signal<AuthUser | null>(this.restoreUser());

  readonly isLoggedIn   = computed(() => !!this._token());
  readonly user         = this._user.asReadonly();
  readonly isSuperAdmin = computed(() => this._user()?.role === 'SUPERADMIN');
  readonly isAdmin      = computed(() => {
    const role = this._user()?.role;
    return role === 'ADMIN' || role === 'SUPERADMIN';
  });
  readonly isMember = computed(() => this._user()?.role === 'MEMBER');

  private restoreUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  getToken(): string | null { return this._token(); }

  // ── Auth ──────────────────────────────────────────────────────────────────

  login(dto: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API}/auth/login`, dto, { withCredentials: true }).pipe(
      tap(res => this.persist(res)),
    );
  }

  refresh(): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${API}/auth/refresh`, {}, { withCredentials: true });
  }

  persistToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this._token.set(token);
  }

  persistUser(user: AuthUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  logout(): void {
    this.http.post(`${API}/auth/logout`, {}, { withCredentials: true }).subscribe({ error: () => {} });
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
  }

  // ── Check email / set password (primo accesso soci) ───────────────────────

  checkEmail(email: string): Observable<{ exists: boolean; hasPassword: boolean }> {
    return this.http.post<{ exists: boolean; hasPassword: boolean }>(`${API}/auth/check-email`, { email });
  }


  setPassword(email: string, password: string): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${API}/auth/set-password`, { email, password });
  }

  // ── Profilo account ───────────────────────────────────────────────────────

  getProfile(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${API}/auth/me`);
  }

  updateProfile(dto: { email?: string; password?: string; currentPassword?: string }): Observable<LoginResponse> {
    return this.http.patch<LoginResponse>(`${API}/auth/me`, dto).pipe(
      tap(res => this.persist(res)),
    );
  }

  deleteProfile(currentPassword: string): Observable<void> {
    return this.http.delete<void>(`${API}/auth/me`, { body: { currentPassword } });
  }

  uploadAvatar(file: File): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ url: string }>(`${API}/uploads/avatar`, form).pipe(
      tap(res => {
        const u = this._user();
        if (u) {
          const updated = { ...u, profileImage: res.url };
          localStorage.setItem(USER_KEY, JSON.stringify(updated));
          this._user.set(updated);
        }
      }),
    );
  }

  // ── Dati anagrafici ───────────────────────────────────────────────────────

  getMyMember(): Observable<MemberDetail | null> {
    return this.http.get<MemberDetail | null>(`${API}/auth/me/member`);
  }

  updateMyMember(dto: UpdateMemberRequest): Observable<MemberDetail> {
    return this.http.patch<MemberDetail>(`${API}/auth/me/member`, dto);
  }

  getMyTessera(): Observable<TesseraInfo> {
    return this.http.get<TesseraInfo>(`${API}/auth/me/tessera`);
  }

  // ── Promozione ruolo (solo SUPERADMIN) ────────────────────────────────────

  promoteRole(memberId: string, role: UserRole, boardRoles: string[]): Observable<AuthUser> {
    return this.http.patch<AuthUser>(`${API}/auth/members/${memberId}/role`, { role, boardRoles });
  }

  private persist(res: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._token.set(res.access_token);
    this._user.set(res.user);
  }
}

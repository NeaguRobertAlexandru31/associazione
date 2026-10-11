import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, from, switchMap, tap } from 'rxjs';
import { fetchAuthSession, signIn, signOut } from 'aws-amplify/auth';
import { environment } from '../../../../environments/environment';
import { AuthUser, MemberDetail, TesseraInfo, UpdateMemberRequest, UserRole } from '../../models/member.model';
import { Analytics } from '../analytics/analytics';

const USER_KEY = 'acr_user';
const API      = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http      = inject(HttpClient);
  private analytics = inject(Analytics);

  private _user = signal<AuthUser | null>(this.restoreUser());

  readonly user         = this._user.asReadonly();
  readonly isLoggedIn   = computed(() => !!this._user());
  readonly isSuperAdmin = computed(() => this._user()?.role === 'SUPERADMIN');
  readonly isAdmin      = computed(() => {
    const role = this._user()?.role;
    return role === 'ADMIN' || role === 'SUPERADMIN';
  });
  readonly isMember = computed(() => this._user()?.role === 'MEMBER');

  private restoreUser(): AuthUser | null {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  login(email: string, password: string): Observable<AuthUser> {
    // Amplify stabilisce la sessione (salva token in sessionStorage)
    // poi il BE recupera il profilo dal DB tramite il token Cognito
    return from(signIn({ username: email, password, options: { authFlowType: 'USER_PASSWORD_AUTH' } })).pipe(
      switchMap(() => this.getProfile()),
      tap(user => {
        this.persistUser(user);
        this.analytics.identify(user.id, { role: user.role });
        this.analytics.capture('login');
      }),
    );
  }

  logout(): void {
    from(fetchAuthSession()).subscribe({
      next: session => {
        const accessToken = session.tokens?.accessToken?.toString();
        if (accessToken) {
          this.http.post(`${API}/auth/logout`, { access_token: accessToken }).subscribe({ error: () => {} });
        }
      },
      error: () => {},
    });
    signOut().catch(() => {});
    sessionStorage.removeItem(USER_KEY);
    this._user.set(null);
    this.analytics.capture('logout');
    this.analytics.reset();
  }

  persistUser(user: AuthUser): void {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  // ── Check email / set password (primo accesso soci) ───────────────────────

  checkEmail(email: string): Observable<{ exists: boolean; hasPassword: boolean }> {
    return this.http.post<{ exists: boolean; hasPassword: boolean }>(`${API}/auth/check-email`, { email });
  }

  setPassword(email: string, password: string): Observable<{ access_token: string; refresh_token?: string }> {
    return this.http.post<{ access_token: string; refresh_token?: string }>(`${API}/auth/set-password`, { email, password });
  }

  // ── Profilo account ───────────────────────────────────────────────────────

  getProfile(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${API}/auth/me`);
  }

  updateProfile(dto: { email?: string; password?: string; currentPassword?: string }): Observable<{ user: AuthUser }> {
    return this.http.patch<{ user: AuthUser }>(`${API}/auth/me`, dto).pipe(
      tap(res => this.persistUser(res.user)),
    );
  }

  deleteProfile(): Observable<void> {
    return this.http.delete<void>(`${API}/auth/me`);
  }

  uploadAvatar(file: File): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ url: string }>(`${API}/uploads/avatar`, form).pipe(
      tap(res => {
        const u = this._user();
        if (u) this.persistUser({ ...u, profileImage: res.url });
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
}

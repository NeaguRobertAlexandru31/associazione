import { Injectable, signal } from '@angular/core';

export interface AuthUser {
  email: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly KEY = 'acr_auth';

  private _loggedIn = signal(!!localStorage.getItem(this.KEY));
  private _user     = signal<AuthUser | null>(this.restore());

  readonly isLoggedIn = this._loggedIn.asReadonly();
  readonly user       = this._user.asReadonly();

  private restore(): AuthUser | null {
    const raw = localStorage.getItem(this.KEY);
    return raw ? JSON.parse(raw) : null;
  }

  login(email: string, password: string): boolean {
    if (email === 'admin@acr.it' && password === 'acr2024') {
      const u: AuthUser = { email, name: 'Amministratore' };
      localStorage.setItem(this.KEY, JSON.stringify(u));
      this._loggedIn.set(true);
      this._user.set(u);
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem(this.KEY);
    this._loggedIn.set(false);
    this._user.set(null);
  }
}

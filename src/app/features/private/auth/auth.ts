import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth';
import { PermissionsService } from '../../../core/services/permissions/permissions';

type Phase = 'email' | 'password' | 'set-password';

@Component({
  selector: 'app-auth',
  imports: [FormsModule, RouterLink],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {
  private auth  = inject(AuthService);
  private perms = inject(PermissionsService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  phase    = signal<Phase>('email');
  email    = '';
  password = '';
  confirm  = '';
  error    = signal<string | null>(null);
  loading  = signal(false);

  showPassword = signal(false);
  showConfirm  = signal(false);

  submitEmail(): void {
    if (!this.email.trim()) return;
    this.error.set(null);
    this.loading.set(true);
    this.auth.checkEmail(this.email.trim()).subscribe({
      next: res => {
        this.loading.set(false);
        if (!res.exists) { this.error.set('Email non trovata. Verifica di essere registrato.'); return; }
        this.phase.set(res.hasPassword ? 'password' : 'set-password');
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Email non trovata. Verifica di essere registrato.');
      },
    });
  }

  submitPassword(): void {
    if (!this.password) return;
    this.error.set(null);
    this.loading.set(true);
    this.auth.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? this.defaultUrl();
        this.router.navigateByUrl(returnUrl);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Password non corretta. Riprova.');
      },
    });
  }

  submitSetPassword(): void {
    if (this.password !== this.confirm) { this.error.set('Le password non coincidono.'); return; }
    if (this.password.length < 6)       { this.error.set('La password deve essere di almeno 6 caratteri.'); return; }
    this.error.set(null);
    this.loading.set(true);
    this.auth.setPassword(this.email.trim(), this.password).subscribe({
      next: res => {
        this.auth.persistToken(res.access_token);
        this.auth.getProfile().subscribe({
          next: user => {
            this.auth.persistUser(user);
            this.loading.set(false);
            const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? this.defaultUrl();
            this.router.navigateByUrl(returnUrl);
          },
          error: () => {
            this.loading.set(false);
            const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? this.defaultUrl();
            this.router.navigateByUrl(returnUrl);
          },
        });
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Errore durante l\'impostazione della password.');
      },
    });
  }

  private defaultUrl(): string {
    const first = this.perms.visiblePages()[0];
    return first ? `/dashboard/${first}` : '/dashboard/settings';
  }

  backToEmail(): void {
    this.phase.set('email');
    this.password = '';
    this.confirm  = '';
    this.error.set(null);
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth';
import { LoginRequest } from '../../../core/models/login.model';

@Component({
  selector: 'app-auth',
  imports: [FormsModule, RouterLink],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {
  private auth   = inject(AuthService);
  private router = inject(Router);

  email    = '';
  password = '';
  error    = signal<string | null>(null);
  loading  = signal(false);

  submit(): void {
    this.error.set(null);
    this.loading.set(true);
    const dto: LoginRequest = { email: this.email, password: this.password };
    this.auth.login(dto).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message ?? 'Credenziali non valide. Riprova.';
        this.error.set(msg);
      },
    });
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth';

@Component({
  selector: 'app-register',
  imports: [FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  private auth   = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  token    = signal<string | null>(null);
  name     = '';
  email    = '';
  password = '';
  confirm  = '';
  error    = signal<string | null>(null);
  loading  = signal(false);
  success  = signal(false);

  ngOnInit(): void {
    const t = this.route.snapshot.queryParamMap.get('token');
    if (!t) {
      this.router.navigate(['/home']);
      return;
    }
    this.token.set(t);
  }

  submit(): void {
    if (this.password !== this.confirm) {
      this.error.set('Le password non coincidono.');
      return;
    }
    this.error.set(null);
    this.loading.set(true);
    this.auth.register({
      token: this.token()!,
      name: this.name,
      email: this.email,
      password: this.password,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/dashboard']), 1500);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message ?? 'Errore durante la registrazione.';
        this.error.set(msg);
      },
    });
  }
}

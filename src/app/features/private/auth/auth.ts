import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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
  error    = signal(false);
  loading  = signal(false);

  async submit(): Promise<void> {
    this.error.set(false);
    this.loading.set(true);
    await new Promise(r => setTimeout(r, 600));
    const ok = this.auth.login(this.email, this.password);
    this.loading.set(false);
    if (ok) this.router.navigate(['/dashboard']);
    else     this.error.set(true);
  }
}

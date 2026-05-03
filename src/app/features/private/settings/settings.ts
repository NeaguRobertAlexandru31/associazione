import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth/auth';

@Component({
  selector: 'app-settings',
  imports: [],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  private auth = inject(AuthService);

  readonly isSuperAdmin = this.auth.isSuperAdmin;
  inviteLink    = signal<string | null>(null);
  inviteLoading = signal(false);
  copied        = signal(false);

  generateInvite(): void {
    this.inviteLoading.set(true);
    this.inviteLink.set(null);
    this.copied.set(false);
    this.auth.createInvite().subscribe({
      next: res => {
        this.inviteLink.set(`${window.location.origin}/register?token=${res.token}`);
        this.inviteLoading.set(false);
      },
      error: () => this.inviteLoading.set(false),
    });
  }

  copyLink(): void {
    const link = this.inviteLink();
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    });
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth/auth';
import { LucideAngularModule } from 'lucide-angular';

type SettingsView = 'profile' | 'edit' | 'delete';

@Component({
  selector: 'app-settings',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  private auth = inject(AuthService);

  readonly isSuperAdmin = this.auth.isSuperAdmin;
  readonly user         = this.auth.user;

  // invite
  inviteLink    = signal<string | null>(null);
  inviteLoading = signal(false);
  copied        = signal(false);

  // profile view state
  view = signal<SettingsView>('profile');

  // edit form
  editName     = signal('');
  editEmail    = signal('');
  editPassword = signal('');
  editCurrent  = signal('');
  editLoading  = signal(false);
  editError    = signal<string | null>(null);
  editSuccess  = signal(false);

  // delete form
  deletePassword = signal('');
  deleteLoading  = signal(false);
  deleteError    = signal<string | null>(null);

  ngOnInit(): void {
    this.auth.getProfile().subscribe({
      next: profile => {
        this.editName.set(profile.name);
        this.editEmail.set(profile.email);
      },
    });
  }

  openEdit(): void {
    const u = this.user();
    this.editName.set(u?.name ?? '');
    this.editEmail.set(u?.email ?? '');
    this.editPassword.set('');
    this.editCurrent.set('');
    this.editError.set(null);
    this.editSuccess.set(false);
    this.view.set('edit');
  }

  saveProfile(): void {
    this.editLoading.set(true);
    this.editError.set(null);
    this.editSuccess.set(false);

    const dto: { name?: string; email?: string; password?: string; currentPassword?: string } = {
      name: this.editName(),
      email: this.editEmail(),
    };
    if (this.editPassword()) {
      dto.password = this.editPassword();
      dto.currentPassword = this.editCurrent();
    }

    this.auth.updateProfile(dto).subscribe({
      next: () => {
        this.editLoading.set(false);
        this.editSuccess.set(true);
        setTimeout(() => { this.editSuccess.set(false); this.view.set('profile'); }, 1500);
      },
      error: (err) => {
        this.editLoading.set(false);
        this.editError.set(err?.error?.message ?? 'Errore durante il salvataggio');
      },
    });
  }

  confirmDelete(): void {
    this.deleteLoading.set(true);
    this.deleteError.set(null);

    this.auth.deleteProfile(this.deletePassword()).subscribe({
      next: () => {
        this.auth.logout();
        window.location.href = '/login';
      },
      error: (err) => {
        this.deleteLoading.set(false);
        this.deleteError.set(err?.error?.message ?? 'Errore durante l\'eliminazione');
      },
    });
  }

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

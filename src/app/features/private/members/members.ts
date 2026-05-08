import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth';
import { DirettivoMember, MembersResponse, SocioMember } from '../../../core/models/member.model';
import { MembersService } from '../../../core/services/members/members';

@Component({
  selector: 'app-members',
  imports: [],
  templateUrl: './members.html',
  styleUrl: './members.css',
})
export class Members implements OnInit {
  private membersService = inject(MembersService);
  private router         = inject(Router);
  private auth           = inject(AuthService);

  readonly isSuperAdmin = this.auth.isSuperAdmin;

  direttivo      = signal<DirettivoMember[]>([]);
  soci           = signal<SocioMember[]>([]);
  membersLoading = signal(true);
  membersError   = signal(false);
  showPrivate    = signal(false);

  confirmDeleteId   = signal<string | null>(null);
  confirmDeleteType = signal<'socio' | 'admin' | null>(null);
  deleteLoading     = signal(false);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.membersLoading.set(true);
    this.membersService.getAll().subscribe({
      next: (res: MembersResponse) => {
        this.direttivo.set(res.direttivo);
        this.soci.set(res.soci);
        this.membersLoading.set(false);
      },
      error: () => {
        this.membersError.set(true);
        this.membersLoading.set(false);
      },
    });
  }

  goToSocio(id: string): void { this.router.navigate(['/dashboard/members/socio', id]); }
  goToAdmin(id: string): void { this.router.navigate(['/dashboard/members/admin', id]); }

  togglePrivate(): void { this.showPrivate.update(v => !v); }

  mask(value: string): string {
    return this.showPrivate() ? value : '••••••••';
  }

  askDelete(id: string, type: 'socio' | 'admin', event: MouseEvent): void {
    event.stopPropagation();
    this.confirmDeleteId.set(id);
    this.confirmDeleteType.set(type);
  }

  cancelDelete(): void {
    this.confirmDeleteId.set(null);
    this.confirmDeleteType.set(null);
  }

  confirmDelete(): void {
    const id   = this.confirmDeleteId();
    const type = this.confirmDeleteType();
    if (!id || !type) return;
    this.deleteLoading.set(true);

    const req = type === 'socio'
      ? this.membersService.deleteSocio(id)
      : this.membersService.deleteAdmin(id);

    req.subscribe({
      next: () => {
        this.deleteLoading.set(false);
        this.cancelDelete();
        this.load();
      },
      error: (err) => {
        this.deleteLoading.set(false);
        alert(err?.error?.message ?? 'Errore durante l\'eliminazione.');
        this.cancelDelete();
      },
    });
  }
}

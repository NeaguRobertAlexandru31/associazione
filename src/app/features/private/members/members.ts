import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth';
import { MemberListItem, MembersResponse } from '../../../core/models/member.model';
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

  direttivo      = signal<MemberListItem[]>([]);
  soci           = signal<MemberListItem[]>([]);
  membersLoading = signal(true);
  membersError   = signal(false);

  confirmDeleteId = signal<string | null>(null);
  deleteLoading   = signal(false);

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

  goToMember(id: string): void { this.router.navigate(['/dashboard/members', id]); }

  askDelete(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.confirmDeleteId.set(id);
  }

  cancelDelete(): void { this.confirmDeleteId.set(null); }

  confirmDelete(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    this.deleteLoading.set(true);

    this.membersService.deleteMember(id).subscribe({
      next: () => {
        this.deleteLoading.set(false);
        this.cancelDelete();
        this.load();
      },
      error: err => {
        this.deleteLoading.set(false);
        alert(err?.error?.message ?? 'Errore durante l\'eliminazione.');
        this.cancelDelete();
      },
    });
  }
}

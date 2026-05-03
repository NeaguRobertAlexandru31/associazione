import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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

  direttivo      = signal<DirettivoMember[]>([]);
  soci           = signal<SocioMember[]>([]);
  membersLoading = signal(true);
  membersError   = signal(false);

  ngOnInit(): void {
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

  goToSocio(id: string): void {
    this.router.navigate(['/dashboard/members/socio', id]);
  }

  goToAdmin(id: string): void {
    this.router.navigate(['/dashboard/members/admin', id]);
  }
}

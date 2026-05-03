import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { DirettivoMember, SocioMemberDetail } from '../../../../core/models/member.model';
import { MembersService } from '../../../../core/services/members/members';

@Component({
  selector: 'app-members-detail',
  imports: [DatePipe],
  templateUrl: './members-detail.html',
  styleUrl: './members-detail.css',
})
export class MembersDetail implements OnInit {
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private service = inject(MembersService);

  type    = signal<'socio' | 'admin'>('socio');
  loading = signal(true);
  error   = signal(false);
  socio   = signal<SocioMemberDetail | null>(null);
  admin   = signal<DirettivoMember | null>(null);

  ngOnInit(): void {
    const url   = this.router.url;
    const isAdmin = url.includes('/members/admin/');
    const id    = this.route.snapshot.paramMap.get('id')!;

    this.type.set(isAdmin ? 'admin' : 'socio');

    if (isAdmin) {
      this.service.getAdmin(id).subscribe({
        next: d  => { this.admin.set(d); this.loading.set(false); },
        error: () => { this.error.set(true); this.loading.set(false); },
      });
    } else {
      this.service.getSocio(id).subscribe({
        next: d  => { this.socio.set(d); this.loading.set(false); },
        error: () => { this.error.set(true); this.loading.set(false); },
      });
    }
  }

  back(): void {
    this.router.navigate(['/dashboard/members']);
  }

  categoryLabel(c: string): string {
    return c === 'under26' ? 'Under 26' : c === 'sostenitore' ? 'Sostenitore' : 'Ordinario';
  }

  statusLabel(s: string): string {
    return s === 'in_attesa_pagamento' ? 'In attesa pagamento'
         : s === 'pagamento_in_corso'  ? 'Pagamento in corso'
         : s === 'attivo'              ? 'Attivo'
         : 'Rifiutato';
  }

  paymentLabel(p: string): string {
    return p === 'bonifico' ? 'Bonifico' : p === 'contanti' ? 'Contanti' : p;
  }

  docTypeLabel(d: string): string {
    return d === 'carta_identita' ? "Carta d'identità"
         : d === 'passaporto'     ? 'Passaporto'
         : d === 'patente'        ? 'Patente'
         : d;
  }
}

import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { MemberVerifyInfo, MemberCategory } from '../../../core/models/member.model';

const CATEGORY_LABELS: Record<MemberCategory, string> = {
  ordinario:    'Ordinario',
  under26:      'Under 26',
  sostenitore:  'Sostenitore',
};

@Component({
  selector: 'app-member-verify',
  imports: [CommonModule, DatePipe],
  templateUrl: './member-verify.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberVerify implements OnInit {
  private route  = inject(ActivatedRoute);
  private http   = inject(HttpClient);

  readonly loading = signal(true);
  readonly member  = signal<MemberVerifyInfo | null>(null);
  readonly error   = signal<string | null>(null);
  readonly now     = new Date();

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.http.get<MemberVerifyInfo>(`${environment.apiUrl}/auth/verify/${id}`)
      .subscribe({
        next: (data) => { this.member.set(data); this.loading.set(false); },
        error: ()     => { this.error.set('Tessera non trovata o non valida.'); this.loading.set(false); },
      });
  }

  categoryLabel(cat: MemberCategory) {
    return CATEGORY_LABELS[cat] ?? cat;
  }

  get statusClass() {
    const s = this.member()?.status;
    if (s === 'attivo') return 'bg-green-100 text-green-700 border-green-200';
    if (s === 'rifiutato') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  }

  get statusLabel() {
    const s = this.member()?.status;
    if (s === 'attivo') return 'Attivo';
    if (s === 'rifiutato') return 'Rifiutato';
    if (s === 'pagamento_in_corso') return 'Pagamento in corso';
    return 'In attesa di pagamento';
  }
}

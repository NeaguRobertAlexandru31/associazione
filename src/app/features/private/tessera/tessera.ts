import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth/auth';
import { TesseraInfo } from '../../../core/models/member.model';

@Component({
  selector: 'app-tessera',
  standalone: true,
  imports: [],
  templateUrl: './tessera.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tessera implements OnInit {
  private auth = inject(AuthService);

  loading     = signal(true);
  tessera     = signal<TesseraInfo | null>(null);
  cardFlipped = signal(false);
  showPayment = signal(false);

  ngOnInit(): void {
    this.auth.getMyTessera().subscribe({
      next: t  => { this.tessera.set(t); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  flipCard():      void { this.cardFlipped.update(v => !v); }
  togglePayment(): void { this.showPayment.update(v => !v); }

  categoryLabel(c: string): string {
    return c === 'under26' ? 'Under 26' : c === 'sostenitore' ? 'Sostenitore' : 'Ordinario';
  }

  tesseraStatusClass(): string {
    const t = this.tessera();
    if (!t) return '';
    if (t.expired || t.status === 'in_attesa_pagamento') return 'text-red-600 bg-red-50 border-red-200';
    if (t.daysLeft <= 30 || t.status === 'pagamento_in_corso') return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-green-700 bg-green-50 border-green-200';
  }

  tesseraStatusDot(): string {
    const t = this.tessera();
    if (!t) return '';
    if (t.expired || t.status === 'in_attesa_pagamento') return 'bg-red-500';
    if (t.daysLeft <= 30 || t.status === 'pagamento_in_corso') return 'bg-yellow-500';
    return 'bg-green-500';
  }

  tesseraStatusLabel(): string {
    const t = this.tessera();
    if (!t) return '';
    if (t.expired)                          return 'Scaduta';
    if (t.status === 'in_attesa_pagamento') return 'In attesa di pagamento';
    if (t.status === 'pagamento_in_corso')  return 'Pagamento in corso';
    if (t.status === 'attivo' && t.daysLeft <= 30) return `Scade tra ${t.daysLeft} giorni`;
    return 'Attiva';
  }

  needsPayment(): boolean {
    const t = this.tessera();
    return !!t && (t.expired || t.status === 'in_attesa_pagamento' || t.status === 'pagamento_in_corso');
  }
}

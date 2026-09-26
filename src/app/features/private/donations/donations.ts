import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FinanceService, FinanceSummary, Transaction, TransactionType } from '../../../core/services/finance/finance';

@Component({
  selector: 'app-donations',
  imports: [DatePipe],
  templateUrl: './donations.html',
})
export class Donations implements OnInit {
  private svc = inject(FinanceService);

  summary = signal<FinanceSummary | null>(null);
  loading = signal(true);
  filter  = signal<TransactionType | 'tutti'>('tutti');

  readonly filters: { value: TransactionType | 'tutti'; label: string }[] = [
    { value: 'tutti',     label: 'Tutti'     },
    { value: 'quota',     label: 'Quote'     },
    { value: 'donazione', label: 'Donazioni' },
  ];

  readonly filtered = computed(() => {
    const s = this.summary();
    if (!s) return [];
    if (this.filter() === 'tutti') return s.transactions;
    return s.transactions.filter(t => t.type === this.filter());
  });

  readonly stats = computed(() => {
    const s = this.summary();
    const allTransactions = s?.transactions ?? [];
    const nQuote     = allTransactions.filter(t => t.type === 'quota').length;
    const nDonazioni = allTransactions.filter(t => t.type === 'donazione').length;
    return [
      { label: 'Totale Entrate',    value: s ? this.fmt(s.totale)         : '—', icon: 'account_balance_wallet', sub: `${this.fmt(s?.questoMese ?? 0)} questo mese` },
      { label: 'Quote Associative', value: s ? this.fmt(s.totaleQuote)    : '—', icon: 'badge',                  sub: `${nQuote} pagamenti` },
      { label: 'Donazioni',         value: s ? this.fmt(s.totaleDonazioni): '—', icon: 'volunteer_activism',     sub: `${nDonazioni} donazioni` },
    ];
  });

  ngOnInit(): void {
    this.svc.getSummary().subscribe({
      next: s => {
        this.summary.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setFilter(f: TransactionType | 'tutti') { this.filter.set(f); }

  fmt(n: number): string {
    return n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  }

  methodLabel(method: string): string {
    const map: Record<string, string> = { card: 'Carta', bank: 'Bonifico', online: 'Online' };
    return map[method] ?? method;
  }

  categoryLabel(cat?: string): string {
    const map: Record<string, string> = { ordinario: 'Ordinario', under26: 'Under 26', sostenitore: 'Sostenitore' };
    return cat ? (map[cat] ?? cat) : '';
  }

  trackById(_: number, t: Transaction): string { return t.id; }
}

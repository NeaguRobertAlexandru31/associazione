import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { SiteSettingsService } from '../../../core/services/site-settings/site-settings';
import { environment } from '../../../../environments/environment';

export interface Plan {
  nameKey: string;
  priceKey: string;
  benefitKeys: string[];
  featured: boolean;
  stripeProductId: string;
}

@Component({
  selector: 'app-membership',
  imports: [TranslatePipe, FormsModule],
  templateUrl: './membership.html',
  styleUrl: './membership.css',
})
export class Membership implements OnInit {
  private router        = inject(Router);
  private http          = inject(HttpClient);
  readonly siteSettings = inject(SiteSettingsService);
  ngOnInit(): void { this.siteSettings.load(); }

  // ── Piani ────────────────────────────────────────────────────────────
  readonly plans: Plan[] = [
    {
      nameKey: 'membership.plan_1_name',
      priceKey: 'membership.plan_1_price',
      benefitKeys: [
        'membership.plan_1_b1',
        'membership.plan_1_b2',
        'membership.plan_1_b3',
        'membership.plan_1_b4',
        'membership.plan_1_b5',
        'membership.plan_1_b6',
        'membership.plan_1_b7',
      ],
      featured: true,
      stripeProductId: 'price_socio',
    },
  ];

  selectPlan(plan: Plan): void {
    this.router.navigate(['/unisciti'], { queryParams: { category: 'ordinario' } });
  }

  // ── 5×1000 ───────────────────────────────────────────────────────────
  readonly fiscalCode = '97812345678';
  copied = signal(false);

  copyCode(): void {
    navigator.clipboard.writeText(this.fiscalCode).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  // ── Donazione Libera ─────────────────────────────────────────────────
  readonly presetAmounts = [10, 25, 50, 100];
  selectedAmount = signal<number | null>(25);
  customAmount = signal('');
  donorName = '';
  donorEmail = '';
  privacyAccepted = false;

  selectAmount(amount: number): void {
    this.selectedAmount.set(amount);
    this.customAmount.set('');
  }

  onCustomAmountInput(value: string): void {
    this.customAmount.set(value);
    this.selectedAmount.set(null);
  }

  loadingDonation = signal(false);

  submitDonation(): void {
    const amount = this.selectedAmount() ?? Number(this.customAmount());
    if (!amount || !this.privacyAccepted) return;
    this.loadingDonation.set(true);
    this.http.post<{ url: string }>(`${environment.apiUrl}/stripe/donation-checkout`, {
      amount,
      frequency: 'once',
      email: this.donorEmail || undefined,
    }).subscribe({
      next:  ({ url }) => { window.location.href = url; },
      error: () => this.loadingDonation.set(false),
    });
  }

}

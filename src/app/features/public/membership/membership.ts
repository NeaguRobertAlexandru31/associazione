import { Component, HostListener, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../i18n/translate.pipe';

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
export class Membership {
  parallaxOffset = 0;

  // ── Piani ────────────────────────────────────────────────────────────
  readonly plans: Plan[] = [
    {
      nameKey: 'membership.plan_1_name',
      priceKey: 'membership.plan_1_price',
      benefitKeys: ['membership.plan_1_b1', 'membership.plan_1_b2', 'membership.plan_1_b3'],
      featured: false,
      stripeProductId: 'price_simpatizzante',
    },
    {
      nameKey: 'membership.plan_2_name',
      priceKey: 'membership.plan_2_price',
      benefitKeys: ['membership.plan_2_b1', 'membership.plan_2_b2', 'membership.plan_2_b3', 'membership.plan_2_b4'],
      featured: true,
      stripeProductId: 'price_sostenitore',
    },
    {
      nameKey: 'membership.plan_3_name',
      priceKey: 'membership.plan_3_price',
      benefitKeys: ['membership.plan_3_b1', 'membership.plan_3_b2', 'membership.plan_3_b3'],
      featured: false,
      stripeProductId: 'price_benemerito',
    },
  ];

  selectPlan(plan: Plan): void {
    // TODO: stripeService.redirectToCheckout(plan.stripeProductId)
    console.log('Selected plan:', plan.stripeProductId);
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

  submitDonation(): void {
    const amount = this.selectedAmount() ?? Number(this.customAmount());
    if (!amount || !this.privacyAccepted) return;
    // TODO: stripeService.redirectToCheckout({ amount, name: this.donorName, email: this.donorEmail })
    console.log('Donation:', { amount, name: this.donorName, email: this.donorEmail });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.parallaxOffset = window.scrollY * 0.25;
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { SiteSettingsService } from '../../../core/services/site-settings/site-settings';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-donations',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './donations.html',
  styleUrl: './donations.css',
})
export class Donations implements OnInit {
  readonly siteSettings = inject(SiteSettingsService);
  private http = inject(HttpClient);
  loadingCheckout = signal(false);
  readonly amounts = [10, 25, 50, 100, 250];
  readonly impacts = [
    { iconKey: 'donations.impact_1_icon', titleKey: 'donations.impact_1_title', descKey: 'donations.impact_1_desc' },
    { iconKey: 'donations.impact_2_icon', titleKey: 'donations.impact_2_title', descKey: 'donations.impact_2_desc' },
    { iconKey: 'donations.impact_3_icon', titleKey: 'donations.impact_3_title', descKey: 'donations.impact_3_desc' },
    { iconKey: 'donations.impact_4_icon', titleKey: 'donations.impact_4_title', descKey: 'donations.impact_4_desc' },
  ];

  ngOnInit(): void { this.siteSettings.load(); }

  selectedAmount = signal<number | null>(25);
  customAmount = signal('');
  frequency = signal<'once' | 'monthly'>('once');
  method = signal<'card' | 'bank'>('card');
  ibanCopied = signal(false);
  cfCopied = signal(false);

  selectAmount(amount: number): void {
    this.selectedAmount.set(amount);
    this.customAmount.set('');
  }

  onCustomInput(value: string): void {
    this.customAmount.set(value);
    this.selectedAmount.set(null);
  }

  copyIban(): void {
    navigator.clipboard.writeText('IT60 X054 2811 1010 0000 0123 456');
    this.ibanCopied.set(true);
    setTimeout(() => this.ibanCopied.set(false), 2000);
  }

  copyCf(): void {
    navigator.clipboard.writeText('97123456789');
    this.cfCopied.set(true);
    setTimeout(() => this.cfCopied.set(false), 2000);
  }

  donate(): void {
    const amount = this.customAmount() ? Number(this.customAmount()) : this.selectedAmount();
    if (!amount || amount <= 0) return;

    this.loadingCheckout.set(true);
    this.http.post<{ url: string }>(`${environment.apiUrl}/stripe/donation-checkout`, {
      amount,
      frequency: this.frequency(),
    }).subscribe({
      next:  ({ url }) => { window.location.href = url; },
      error: () => this.loadingCheckout.set(false),
    });
  }
}

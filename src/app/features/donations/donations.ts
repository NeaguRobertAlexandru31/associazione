import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-donations',
  imports: [RouterLink, FormsModule, TranslatePipe],
  templateUrl: './donations.html',
  styleUrl: './donations.css',
})
export class Donations {
  readonly amounts = [10, 25, 50, 100, 250];
  readonly impacts = [
    { iconKey: 'donations.impact_1_icon', titleKey: 'donations.impact_1_title', descKey: 'donations.impact_1_desc' },
    { iconKey: 'donations.impact_2_icon', titleKey: 'donations.impact_2_title', descKey: 'donations.impact_2_desc' },
    { iconKey: 'donations.impact_3_icon', titleKey: 'donations.impact_3_title', descKey: 'donations.impact_3_desc' },
    { iconKey: 'donations.impact_4_icon', titleKey: 'donations.impact_4_title', descKey: 'donations.impact_4_desc' },
  ];

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
}

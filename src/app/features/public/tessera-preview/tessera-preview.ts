import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistrationResultService } from '../../../core/services/registration-result/registration-result';

@Component({
  selector: 'app-tessera-preview',
  imports: [CommonModule],
  templateUrl: './tessera-preview.html',
  styleUrl: './tessera-preview.css',
})
export class TesseraPreview {
  private resultSvc = inject(RegistrationResultService);

  flipped = false;
  flip() { this.flipped = !this.flipped; }

  readonly result = this.resultSvc.result;

  readonly memberName = computed(() => {
    const r = this.result();
    return r?.firstName && r?.lastName ? `${r.firstName} ${r.lastName}` : 'Maria Ionescu';
  });

  readonly memberFirstName = computed(() => this.result()?.firstName ?? 'Maria');

  readonly categoryLabel = computed(() => {
    const map: Record<string, string> = { ordinario: 'Ordinario', under26: 'Under 26', sostenitore: 'Sostenitore' };
    return map[this.result()?.category ?? ''] ?? 'Ordinario';
  });

  readonly cardCode = computed(() => {
    const r = this.result();
    const year = r?.membershipYear ?? new Date().getFullYear();
    const num  = r?.id ? r.id.slice(-4).toUpperCase() : '0042';
    return `ACR · ${year} · ${num}`;
  });

  readonly validityLabel = computed(() => {
    const year = this.result()?.membershipYear ?? new Date().getFullYear();
    return `Valida dal 01/01/${year} al 31/12/${year}`;
  });

  readonly isReal = computed(() => !!this.result()?.id);
}

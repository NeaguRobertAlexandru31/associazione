import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  CreateRegistrationRequest,
  DocType,
  GuardianDto,
  MemberCategory,
  MemberGender,
  PaymentMethod,
} from '../../../core/models/registration.model';
import { RegistrationResultService } from '../../../core/services/registration-result/registration-result';
import { RegistrationsService } from '../../../core/services/registrations/registrations';

const CATEGORY_LABELS: Record<MemberCategory, string> = {
  ordinario:   'Ordinario',
  under26:     'Under 26',
  sostenitore: 'Sostenitore',
};

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private svc     = inject(RegistrationsService);
  private result  = inject(RegistrationResultService);

  step    = signal(1);
  loading = signal(false);
  error   = signal<string | null>(null);

  // ── Form model ───────────────────────────────────────────────────────
  category: MemberCategory       = 'ordinario';
  isMinor                        = false;
  firstName  = ''; lastName   = '';
  fiscalCode = ''; birthDate  = ''; birthPlace = '';
  gender: MemberGender           = 'm';
  docType: DocType               = 'ci';
  docNumber  = ''; docExpiry  = '';
  email      = ''; phone      = '';
  addressStreet   = ''; addressZip      = '';
  addressCity     = ''; addressProvince = '';
  guardian: GuardianDto = {
    firstName: '', lastName: '', fiscalCode: '',
    relation: 'genitore', docType: 'ci', docNumber: '', docExpiry: '',
  };
  privacyBase         = false;
  privacyNewsletter   = false;
  privacyThirdParties = false;
  paymentMethod: PaymentMethod = 'contanti';

  // ── Steps ────────────────────────────────────────────────────────────
  readonly stepLabels = ['Tipo', 'Dati', 'Contatti', 'Tutore', 'Privacy'];
  totalSteps = computed(() => this.isMinor ? 5 : 4);

  readonly categoryOptions: { value: MemberCategory; label: string; desc: string; price: string }[] = [
    { value: 'ordinario',   label: 'Ordinario',   desc: 'Accesso completo all\'associazione',           price: '€ 30 / anno' },
    { value: 'under26',     label: 'Under 26',    desc: 'Per chi ha meno di 26 anni',                   price: '€ 15 / anno' },
    { value: 'sostenitore', label: 'Sostenitore', desc: 'Sostieni attivamente l\'associazione',         price: '€ 50 / anno' },
  ];

  readonly genderOptions    = [{ value: 'm', label: 'Maschio' }, { value: 'f', label: 'Femmina' }, { value: 'altro', label: 'Altro' }];
  readonly docTypeOptions   = [{ value: 'ci', label: 'Carta d\'identità' }, { value: 'passaporto', label: 'Passaporto' }, { value: 'patente', label: 'Patente' }];
  readonly relationOptions  = [{ value: 'genitore', label: 'Genitore' }, { value: 'tutore_legale', label: 'Tutore legale' }];

  ngOnInit(): void {
    const cat = this.route.snapshot.queryParamMap.get('category') as MemberCategory | null;
    if (cat && ['ordinario', 'under26', 'sostenitore'].includes(cat)) {
      this.category = cat;
    }
  }

  get categoryLabel(): string { return CATEGORY_LABELS[this.category]; }

  // Step 3 is "Tutore" only if isMinor, otherwise step 3 = Contatti, step 4 = Privacy
  private get effectiveStep(): number {
    if (!this.isMinor && this.step() >= 3) return this.step() + 1; // skip tutore slot
    return this.step();
  }

  isStepVisible(s: number): boolean { return this.step() === s; }

  next(): void {
    this.error.set(null);
    if (!this.validateCurrent()) return;
    // skip tutore step (step 4) if not minor
    if (this.step() === 3 && !this.isMinor) {
      this.step.set(5);
    } else {
      this.step.update(s => s + 1);
    }
  }

  back(): void {
    this.error.set(null);
    if (this.step() === 5 && !this.isMinor) {
      this.step.set(3);
    } else {
      this.step.update(s => s - 1);
    }
  }

  private validateCurrent(): boolean {
    switch (this.step()) {
      case 1: return true;
      case 2:
        if (!this.firstName || !this.lastName) { this.error.set('Nome e cognome obbligatori'); return false; }
        if (!this.fiscalCode) { this.error.set('Codice fiscale obbligatorio'); return false; }
        if (!this.birthDate || !this.birthPlace) { this.error.set('Data e luogo di nascita obbligatori'); return false; }
        return true;
      case 3:
        if (!this.docNumber || !this.docExpiry) { this.error.set('Dati documento obbligatori'); return false; }
        if (new Date(this.docExpiry) <= new Date()) { this.error.set('Il documento è scaduto'); return false; }
        if (!this.email || !this.phone) { this.error.set('Email e telefono obbligatori'); return false; }
        if (!this.addressStreet || !this.addressZip || !this.addressCity || !this.addressProvince) {
          this.error.set('Indirizzo completo obbligatorio'); return false;
        }
        return true;
      case 4:
        if (!this.guardian.firstName || !this.guardian.lastName) { this.error.set('Nome e cognome del tutore obbligatori'); return false; }
        if (!this.guardian.fiscalCode) { this.error.set('Codice fiscale del tutore obbligatorio'); return false; }
        if (!this.guardian.docNumber || !this.guardian.docExpiry) { this.error.set('Dati documento del tutore obbligatori'); return false; }
        if (new Date(this.guardian.docExpiry) <= new Date()) { this.error.set('Il documento del tutore è scaduto'); return false; }
        return true;
      default: return true;
    }
  }

  submit(): void {
    if (!this.privacyBase) { this.error.set('Il consenso privacy è obbligatorio'); return; }
    this.error.set(null);
    this.loading.set(true);

    const dto: CreateRegistrationRequest = {
      isMinor:            this.isMinor,
      category:           this.category,
      firstName:          this.firstName,
      lastName:           this.lastName,
      fiscalCode:         this.fiscalCode,
      birthDate:          this.birthDate,
      birthPlace:         this.birthPlace,
      gender:             this.gender,
      docType:            this.docType,
      docNumber:          this.docNumber,
      docExpiry:          this.docExpiry,
      email:              this.email,
      phone:              this.phone,
      addressStreet:      this.addressStreet,
      addressZip:         this.addressZip,
      addressCity:        this.addressCity,
      addressProvince:    this.addressProvince,
      paymentMethod:      this.paymentMethod,
      privacyBase:        this.privacyBase,
      privacyNewsletter:  this.privacyNewsletter,
      privacyThirdParties: this.privacyThirdParties,
      ...(this.isMinor && { guardian: this.guardian }),
    };

    this.svc.create(dto).subscribe({
      next: (res) => {
        this.result.set({ ...res, firstName: this.firstName, lastName: this.lastName, category: this.category });
        this.loading.set(false);
        this.router.navigate(['/tessera-preview']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Si è verificato un errore. Riprova.');
      },
    });
  }

  progressWidth = computed(() => {
    const current = this.step();
    const total   = this.totalSteps();
    const steps   = total === 5 ? [1,2,3,4,5] : [1,2,3,5]; // map visible steps
    const idx     = steps.indexOf(current);
    return `${Math.round(((idx) / (total - 1)) * 100)}%`;
  });
}

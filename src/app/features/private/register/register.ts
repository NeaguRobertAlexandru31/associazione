import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth';
import { RegistrationsService } from '../../../core/services/registrations/registrations';
import {
  CreateRegistrationRequest,
  DocType,
  GuardianDto,
  MemberCategory,
  MemberGender,
  PaymentMethod,
} from '../../../core/models/registration.model';

type Phase = 'email-check' | 'membership' | 'account';

@Component({
  selector: 'app-register',
  imports: [FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  private auth   = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private regSvc = inject(RegistrationsService);

  token   = signal<string | null>(null);
  phase   = signal<Phase>('email-check');
  error   = signal<string | null>(null);
  loading = signal(false);
  success = signal(false);

  // ── Phase 1: email check ─────────────────────────────────────────────
  checkEmail = '';

  // ── Phase 2: membership form ─────────────────────────────────────────
  memberStep = signal(1);

  category: MemberCategory = 'ordinario';
  isMinor     = false;
  firstName   = ''; lastName     = '';
  fiscalCode  = ''; birthDate    = ''; birthPlace = '';
  gender: MemberGender = 'm';
  docType: DocType     = 'ci';
  docNumber   = ''; docExpiry    = '';
  memberEmail = '';
  phone       = '';
  addressStreet = ''; addressZip      = '';
  addressCity   = ''; addressProvince = '';
  guardian: GuardianDto = {
    firstName: '', lastName: '', fiscalCode: '',
    relation: 'genitore', docType: 'ci', docNumber: '', docExpiry: '',
  };
  privacyBase         = false;
  privacyNewsletter   = false;
  privacyThirdParties = false;
  paymentMethod: PaymentMethod = 'contanti';

  readonly memberTotalSteps = computed(() => this.isMinor ? 5 : 4);

  readonly categoryOptions: { value: MemberCategory; label: string; price: string }[] = [
    { value: 'ordinario',   label: 'Ordinario',   price: '€ 30 / anno' },
    { value: 'under26',     label: 'Under 26',    price: '€ 15 / anno' },
    { value: 'sostenitore', label: 'Sostenitore', price: '€ 50 / anno' },
  ];
  readonly genderOptions   = [{ value: 'm', label: 'Maschio' }, { value: 'f', label: 'Femmina' }, { value: 'altro', label: 'Altro' }];
  readonly docTypeOptions  = [{ value: 'ci', label: 'Carta d\'identità' }, { value: 'passaporto', label: 'Passaporto' }, { value: 'patente', label: 'Patente' }];
  readonly relationOptions = [{ value: 'genitore', label: 'Genitore' }, { value: 'tutore_legale', label: 'Tutore legale' }];

  // ── Phase 3: account ─────────────────────────────────────────────────
  accountName = '';
  password    = '';
  confirm     = '';

  ngOnInit(): void {
    const t = this.route.snapshot.queryParamMap.get('token');
    if (!t) {
      this.router.navigate(['/home']);
      return;
    }
    this.token.set(t);
  }

  // ── Phase 1 ───────────────────────────────────────────────────────────
  submitEmailCheck(): void {
    if (!this.checkEmail) return;
    this.error.set(null);
    this.loading.set(true);
    this.auth.checkMember(this.checkEmail).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.memberEmail = this.checkEmail;
        if (res.isMember) {
          this.accountName = res.name ?? '';
          this.phase.set('account');
        } else {
          this.phase.set('membership');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Errore durante la verifica. Riprova.');
      },
    });
  }

  // ── Phase 2 ───────────────────────────────────────────────────────────
  memberNext(): void {
    this.error.set(null);
    if (!this.validateMemberStep()) return;
    if (this.memberStep() === 3 && !this.isMinor) {
      this.memberStep.set(5);
    } else {
      this.memberStep.update(s => s + 1);
    }
  }

  memberBack(): void {
    this.error.set(null);
    if (this.memberStep() === 1) {
      this.phase.set('email-check');
    } else if (this.memberStep() === 5 && !this.isMinor) {
      this.memberStep.set(3);
    } else {
      this.memberStep.update(s => s - 1);
    }
  }

  private validateMemberStep(): boolean {
    switch (this.memberStep()) {
      case 2:
        if (!this.firstName || !this.lastName) { this.error.set('Nome e cognome obbligatori'); return false; }
        if (!this.fiscalCode)                   { this.error.set('Codice fiscale obbligatorio'); return false; }
        if (!this.birthDate || !this.birthPlace) { this.error.set('Data e luogo di nascita obbligatori'); return false; }
        return true;
      case 3:
        if (!this.docNumber || !this.docExpiry)  { this.error.set('Dati documento obbligatori'); return false; }
        if (new Date(this.docExpiry) <= new Date()) { this.error.set('Il documento è scaduto'); return false; }
        if (!this.phone)                          { this.error.set('Numero di telefono obbligatorio'); return false; }
        if (!this.addressStreet || !this.addressZip || !this.addressCity || !this.addressProvince) {
          this.error.set('Indirizzo completo obbligatorio'); return false;
        }
        return true;
      case 4:
        if (!this.guardian.firstName || !this.guardian.lastName) { this.error.set('Nome e cognome del tutore obbligatori'); return false; }
        if (!this.guardian.fiscalCode)  { this.error.set('Codice fiscale del tutore obbligatorio'); return false; }
        if (!this.guardian.docNumber || !this.guardian.docExpiry) { this.error.set('Dati documento del tutore obbligatori'); return false; }
        if (new Date(this.guardian.docExpiry) <= new Date()) { this.error.set('Il documento del tutore è scaduto'); return false; }
        return true;
      default: return true;
    }
  }

  submitMembership(): void {
    if (!this.privacyBase) { this.error.set('Il consenso privacy è obbligatorio'); return; }
    this.error.set(null);
    this.loading.set(true);

    const dto: CreateRegistrationRequest = {
      isMinor:             this.isMinor,
      category:            this.category,
      firstName:           this.firstName,
      lastName:            this.lastName,
      fiscalCode:          this.fiscalCode,
      birthDate:           this.birthDate,
      birthPlace:          this.birthPlace,
      gender:              this.gender,
      docType:             this.docType,
      docNumber:           this.docNumber,
      docExpiry:           this.docExpiry,
      email:               this.memberEmail,
      phone:               this.phone,
      addressStreet:       this.addressStreet,
      addressZip:          this.addressZip,
      addressCity:         this.addressCity,
      addressProvince:     this.addressProvince,
      paymentMethod:       this.paymentMethod,
      privacyBase:         this.privacyBase,
      privacyNewsletter:   this.privacyNewsletter,
      privacyThirdParties: this.privacyThirdParties,
      ...(this.isMinor && { guardian: this.guardian }),
    };

    this.regSvc.create(dto).subscribe({
      next: () => {
        this.loading.set(false);
        this.accountName = `${this.firstName} ${this.lastName}`;
        this.phase.set('account');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Errore durante la registrazione come socio.');
      },
    });
  }

  memberProgressWidth = computed(() => {
    const s     = this.memberStep();
    const total = this.memberTotalSteps();
    const map: Record<number, number> = total === 5
      ? { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 }
      : { 1: 0, 2: 1, 3: 2, 5: 3 };
    const idx = map[s] ?? 0;
    return `${Math.round((idx / (total - 1)) * 100)}%`;
  });

  // ── Phase 3 ───────────────────────────────────────────────────────────
  submitAccount(): void {
    if (this.password !== this.confirm) { this.error.set('Le password non coincidono.'); return; }
    if (this.password.length < 6)       { this.error.set('La password deve essere di almeno 6 caratteri.'); return; }
    this.error.set(null);
    this.loading.set(true);
    this.auth.register({
      token:    this.token()!,
      name:     this.accountName,
      email:    this.memberEmail,
      password: this.password,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/dashboard']), 1500);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Errore durante la creazione dell\'account.');
      },
    });
  }
}

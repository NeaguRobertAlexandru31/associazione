import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MemberAuthService, UpdateMemberMeRequest } from '../../../core/services/member-auth/member-auth';
import { SocioMemberDetail } from '../../../core/models/member.model';

type Phase = 'email' | 'set-password' | 'login' | 'data';

@Component({
  selector: 'app-personal',
  imports: [DatePipe, FormsModule],
  templateUrl: './personal.html',
  styleUrl: './personal.css',
})
export class Personal implements OnInit {
  private memberAuth = inject(MemberAuthService);
  private router     = inject(Router);

  phase   = signal<Phase>('email');
  loading = signal(false);
  error   = signal<string | null>(null);
  member  = signal<SocioMemberDetail | null>(null);

  // step email
  emailInput = '';

  // step set-password
  newPassword    = '';
  confirmPassword = '';

  // step login
  loginPassword = '';

  // dati
  showPrivate     = signal(false);
  editMode        = signal(false);
  saving          = signal(false);
  saveError       = signal<string | null>(null);
  confirmDelete   = signal(false);
  deleteLoading   = signal(false);
  avatarUploading = signal(false);

  editFirstName       = '';
  editLastName        = '';
  editFiscalCode      = '';
  editBirthDate       = '';
  editBirthPlace      = '';
  editGender          = '';
  editDocType         = '';
  editDocNumber       = '';
  editDocExpiry       = '';
  editEmail           = '';
  editPhone           = '';
  editAddressStreet   = '';
  editAddressZip      = '';
  editAddressCity     = '';
  editAddressProvince = '';
  editNewsletter      = false;
  editThirdParties    = false;

  readonly genderOptions  = [{ value: 'm', label: 'Maschio' }, { value: 'f', label: 'Femmina' }, { value: 'altro', label: 'Altro' }];
  readonly docTypeOptions = [{ value: 'ci', label: "Carta d'identità" }, { value: 'passaporto', label: 'Passaporto' }, { value: 'patente', label: 'Patente' }];

  ngOnInit(): void {
    if (this.memberAuth.isLoggedIn()) {
      this.loading.set(true);
      this.memberAuth.getMe().subscribe({
        next: m  => { this.member.set(m); this.loading.set(false); this.phase.set('data'); },
        error: () => { this.memberAuth.logout(); this.loading.set(false); this.phase.set('email'); },
      });
    }
  }

  // ── Phase: email ────────────────────────────────────────────────────────

  submitEmail(): void {
    if (!this.emailInput.trim()) return;
    this.error.set(null);
    this.loading.set(true);
    this.memberAuth.checkEmail(this.emailInput.trim()).subscribe({
      next: res => {
        this.loading.set(false);
        if (!res.exists) {
          this.error.set('Questa email non è associata a nessuna iscrizione.');
          return;
        }
        this.phase.set(res.hasPassword ? 'login' : 'set-password');
      },
      error: () => { this.loading.set(false); this.error.set('Errore di rete. Riprova.'); },
    });
  }

  // ── Phase: set-password ─────────────────────────────────────────────────

  submitSetPassword(): void {
    if (this.newPassword.length < 8) {
      this.error.set('La password deve essere di almeno 8 caratteri.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error.set('Le password non coincidono.');
      return;
    }
    this.error.set(null);
    this.loading.set(true);
    this.memberAuth.setPassword(this.emailInput.trim(), this.newPassword).subscribe({
      next: res => {
        this.memberAuth.persistToken(res.access_token);
        this.loadData();
      },
      error: err => { this.loading.set(false); this.error.set(err?.error?.message ?? 'Errore. Riprova.'); },
    });
  }

  // ── Phase: login ────────────────────────────────────────────────────────

  submitLogin(): void {
    if (!this.loginPassword) return;
    this.error.set(null);
    this.loading.set(true);
    this.memberAuth.login(this.emailInput.trim(), this.loginPassword).subscribe({
      next: res => {
        this.memberAuth.persistToken(res.access_token);
        this.loadData();
      },
      error: () => { this.loading.set(false); this.error.set('Password non corretta.'); },
    });
  }

  private loadData(): void {
    this.memberAuth.getMe().subscribe({
      next: m  => { this.member.set(m); this.loading.set(false); this.phase.set('data'); },
      error: () => { this.loading.set(false); this.error.set('Errore nel caricamento dei dati.'); },
    });
  }

  // ── Phase: data — modifica ──────────────────────────────────────────────

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.avatarUploading.set(true);
    this.memberAuth.uploadAvatar(file).subscribe({
      next: res => {
        this.member.update(m => m ? { ...m, profileImage: res.url } : m);
        this.avatarUploading.set(false);
      },
      error: () => this.avatarUploading.set(false),
    });
  }

  togglePrivate(): void { this.showPrivate.update(v => !v); }

  mask(value: string | undefined | null): string {
    if (!value) return '—';
    return this.showPrivate() ? value : '••••••••';
  }

  startEdit(): void {
    const m = this.member();
    if (!m) return;
    this.editFirstName       = m.firstName;
    this.editLastName        = m.lastName;
    this.editFiscalCode      = m.fiscalCode;
    this.editBirthDate       = m.birthDate ? m.birthDate.substring(0, 10) : '';
    this.editBirthPlace      = m.birthPlace;
    this.editGender          = m.gender;
    this.editDocType         = m.docType;
    this.editDocNumber       = m.docNumber;
    this.editDocExpiry       = m.docExpiry ? m.docExpiry.substring(0, 10) : '';
    this.editEmail           = m.email;
    this.editPhone           = m.phone;
    this.editAddressStreet   = m.addressStreet;
    this.editAddressZip      = m.addressZip;
    this.editAddressCity     = m.addressCity;
    this.editAddressProvince = m.addressProvince;
    this.editNewsletter      = m.privacyNewsletter;
    this.editThirdParties    = m.privacyThirdParties;
    this.saveError.set(null);
    this.editMode.set(true);
  }

  cancelEdit(): void { this.editMode.set(false); this.saveError.set(null); }

  saveEdit(): void {
    this.saving.set(true);
    this.saveError.set(null);
    const dto: UpdateMemberMeRequest = {
      firstName:           this.editFirstName,
      lastName:            this.editLastName,
      fiscalCode:          this.editFiscalCode,
      birthDate:           this.editBirthDate,
      birthPlace:          this.editBirthPlace,
      gender:              this.editGender,
      docType:             this.editDocType,
      docNumber:           this.editDocNumber,
      docExpiry:           this.editDocExpiry,
      email:               this.editEmail,
      phone:               this.editPhone,
      addressStreet:       this.editAddressStreet,
      addressZip:          this.editAddressZip,
      addressCity:         this.editAddressCity,
      addressProvince:     this.editAddressProvince,
      privacyNewsletter:   this.editNewsletter,
      privacyThirdParties: this.editThirdParties,
    };
    this.memberAuth.updateMe(dto).subscribe({
      next: updated => { this.member.set(updated); this.saving.set(false); this.editMode.set(false); },
      error: err    => { this.saving.set(false); this.saveError.set(err?.error?.message ?? 'Errore durante il salvataggio.'); },
    });
  }

  askDelete():    void { this.confirmDelete.set(true); }
  cancelDelete(): void { this.confirmDelete.set(false); }

  doDelete(): void {
    this.deleteLoading.set(true);
    this.memberAuth.deleteMe().subscribe({
      next: () => {
        this.memberAuth.logout();
        this.member.set(null);
        this.confirmDelete.set(false);
        this.deleteLoading.set(false);
        this.phase.set('email');
      },
      error: err => {
        this.deleteLoading.set(false);
        this.confirmDelete.set(false);
        alert(err?.error?.message ?? 'Errore durante la cancellazione.');
      },
    });
  }

  // ── Navigazione ─────────────────────────────────────────────────────────

  backToEmail():   void { this.phase.set('email'); this.error.set(null); }
  goToSite():      void { this.router.navigate(['/home']); }
  goToMembership():void { this.router.navigate(['/unisciti']); }

  logout(): void {
    this.memberAuth.logout();
    this.phase.set('email');
    this.member.set(null);
    this.loginPassword   = '';
    this.newPassword     = '';
    this.confirmPassword = '';
  }

  // ── Label helpers ───────────────────────────────────────────────────────

  categoryLabel(c: string): string {
    return c === 'under26' ? 'Under 26' : c === 'sostenitore' ? 'Sostenitore' : 'Ordinario';
  }

  statusLabel(s: string): string {
    return s === 'in_attesa_pagamento' ? 'In attesa pagamento'
         : s === 'pagamento_in_corso'  ? 'Pagamento in corso'
         : s === 'attivo'              ? 'Attivo'
         : 'Rifiutato';
  }
}

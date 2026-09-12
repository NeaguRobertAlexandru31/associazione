import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth';
import { UpdateMemberRequest } from '../../../core/models/member.model';
import { MemberDetail } from '../../../core/models/member.model';

@Component({
  selector: 'app-personal',
  imports: [DatePipe, FormsModule],
  templateUrl: './personal.html',
  styleUrl: './personal.css',
})
export class Personal implements OnInit {
  private auth    = inject(AuthService);
  private router  = inject(Router);

  loading = signal(false);
  error   = signal<string | null>(null);
  member  = signal<MemberDetail | null>(null);

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
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/area-socio' } });
      return;
    }
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.auth.getMyMember().subscribe({
      next: m  => { this.member.set(m); this.loading.set(false); },
      error: () => { this.loading.set(false); this.error.set('Errore nel caricamento dei dati.'); },
    });
  }

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.avatarUploading.set(true);
    this.auth.uploadAvatar(file).subscribe({
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
    this.editFiscalCode      = m.fiscalCode ?? '';
    this.editBirthDate       = m.birthDate ? m.birthDate.substring(0, 10) : '';
    this.editBirthPlace      = m.birthPlace ?? '';
    this.editGender          = m.gender ?? '';
    this.editDocType         = m.docType ?? '';
    this.editDocNumber       = m.docNumber ?? '';
    this.editDocExpiry       = m.docExpiry ? m.docExpiry.substring(0, 10) : '';
    this.editEmail           = m.email;
    this.editPhone           = m.phone ?? '';
    this.editAddressStreet   = m.addressStreet ?? '';
    this.editAddressZip      = m.addressZip ?? '';
    this.editAddressCity     = m.addressCity ?? '';
    this.editAddressProvince = m.addressProvince ?? '';
    this.editNewsletter      = m.privacyNewsletter;
    this.editThirdParties    = m.privacyThirdParties;
    this.saveError.set(null);
    this.editMode.set(true);
  }

  cancelEdit(): void { this.editMode.set(false); this.saveError.set(null); }

  saveEdit(): void {
    this.saving.set(true);
    this.saveError.set(null);
    const dto: UpdateMemberRequest = {
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
    this.auth.updateMyMember(dto).subscribe({
      next: updated => { this.member.set(updated); this.saving.set(false); this.editMode.set(false); },
      error: err    => { this.saving.set(false); this.saveError.set(err?.error?.message ?? 'Errore durante il salvataggio.'); },
    });
  }

  askDelete():    void { this.confirmDelete.set(true); }
  cancelDelete(): void { this.confirmDelete.set(false); }

  doDelete(): void {
    this.deleteLoading.set(true);
    this.auth.deleteProfile('').subscribe({
      next: () => {
        this.auth.logout();
        this.router.navigate(['/home']);
      },
      error: err => {
        this.deleteLoading.set(false);
        this.confirmDelete.set(false);
        alert(err?.error?.message ?? 'Errore durante la cancellazione.');
      },
    });
  }

  goToSite():       void { this.router.navigate(['/home']); }
  goToMembership(): void { this.router.navigate(['/unisciti']); }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

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

import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth/auth';
import { DirettivoMember, SocioMemberDetail, UpdateSocioRequest } from '../../../../core/models/member.model';
import { MembersService } from '../../../../core/services/members/members';

@Component({
  selector: 'app-members-detail',
  imports: [DatePipe, FormsModule],
  templateUrl: './members-detail.html',
  styleUrl: './members-detail.css',
})
export class MembersDetail implements OnInit {
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private service = inject(MembersService);
  private auth    = inject(AuthService);

  readonly isSuperAdmin = this.auth.isSuperAdmin;

  type    = signal<'socio' | 'admin'>('socio');
  loading = signal(true);
  error   = signal(false);
  socio   = signal<SocioMemberDetail | null>(null);
  admin   = signal<DirettivoMember | null>(null);

  showPrivate   = signal(false);
  editMode      = signal(false);
  saving        = signal(false);
  saveError     = signal<string | null>(null);
  confirmDelete = signal(false);
  deleteLoading = signal(false);

  // Campi del form di modifica — plain properties per [(ngModel)]
  editFirstName       = ''; editLastName        = '';
  editFiscalCode      = ''; editBirthDate       = ''; editBirthPlace  = '';
  editGender          = ''; editDocType         = ''; editDocNumber   = '';
  editDocExpiry       = ''; editEmail           = ''; editPhone       = '';
  editAddressStreet   = ''; editAddressZip      = '';
  editAddressCity     = ''; editAddressProvince = '';
  editCategory        = ''; editStatus          = ''; editPaymentMethod = '';
  editIsMinor         = false;

  readonly categoryOptions  = [{ value: 'ordinario', label: 'Ordinario' }, { value: 'under26', label: 'Under 26' }, { value: 'sostenitore', label: 'Sostenitore' }];
  readonly statusOptions    = [{ value: 'in_attesa_pagamento', label: 'In attesa pagamento' }, { value: 'pagamento_in_corso', label: 'Pagamento in corso' }, { value: 'attivo', label: 'Attivo' }, { value: 'rifiutato', label: 'Rifiutato' }];
  readonly genderOptions    = [{ value: 'm', label: 'Maschio' }, { value: 'f', label: 'Femmina' }, { value: 'altro', label: 'Altro' }];
  readonly docTypeOptions   = [{ value: 'ci', label: 'Carta d\'identità' }, { value: 'passaporto', label: 'Passaporto' }, { value: 'patente', label: 'Patente' }];
  readonly paymentOptions   = [{ value: 'contanti', label: 'Contanti' }, { value: 'online', label: 'Online' }];

  ngOnInit(): void {
    const url     = this.router.url;
    const isAdmin = url.includes('/members/admin/');
    const id      = this.route.snapshot.paramMap.get('id')!;
    this.type.set(isAdmin ? 'admin' : 'socio');

    if (isAdmin) {
      this.service.getAdmin(id).subscribe({
        next: d  => { this.admin.set(d); this.loading.set(false); },
        error: () => { this.error.set(true); this.loading.set(false); },
      });
    } else {
      this.service.getSocio(id).subscribe({
        next: d  => { this.socio.set(d); this.loading.set(false); },
        error: () => { this.error.set(true); this.loading.set(false); },
      });
    }
  }

  back(): void { this.router.navigate(['/dashboard/members']); }

  togglePrivate(): void { this.showPrivate.update(v => !v); }

  mask(value: string | undefined | null): string {
    if (!value) return '—';
    return this.showPrivate() ? value : '••••••••';
  }

  // ── Edit ─────────────────────────────────────────────────────────────
  startEdit(): void {
    const s = this.socio();
    if (!s) return;
    this.editFirstName       = s.firstName;
    this.editLastName        = s.lastName;
    this.editFiscalCode      = s.fiscalCode;
    this.editBirthDate       = s.birthDate ? s.birthDate.substring(0, 10) : '';
    this.editBirthPlace      = s.birthPlace;
    this.editGender          = s.gender;
    this.editDocType         = s.docType;
    this.editDocNumber       = s.docNumber;
    this.editDocExpiry       = s.docExpiry ? s.docExpiry.substring(0, 10) : '';
    this.editEmail           = s.email;
    this.editPhone           = s.phone;
    this.editAddressStreet   = s.addressStreet;
    this.editAddressZip      = s.addressZip;
    this.editAddressCity     = s.addressCity;
    this.editAddressProvince = s.addressProvince;
    this.editCategory        = s.category;
    this.editStatus          = s.status;
    this.editPaymentMethod   = s.paymentMethod;
    this.editIsMinor         = s.isMinor;
    this.saveError.set(null);
    this.editMode.set(true);
  }

  cancelEdit(): void { this.editMode.set(false); this.saveError.set(null); }

  saveEdit(): void {
    const s = this.socio();
    if (!s) return;
    this.saving.set(true);
    this.saveError.set(null);

    const dto: UpdateSocioRequest = {
      firstName: this.editFirstName, lastName: this.editLastName,
      fiscalCode: this.editFiscalCode, birthDate: this.editBirthDate,
      birthPlace: this.editBirthPlace, gender: this.editGender,
      docType: this.editDocType, docNumber: this.editDocNumber,
      docExpiry: this.editDocExpiry, email: this.editEmail,
      phone: this.editPhone, addressStreet: this.editAddressStreet,
      addressZip: this.editAddressZip, addressCity: this.editAddressCity,
      addressProvince: this.editAddressProvince,
      category: this.editCategory as any, status: this.editStatus as any,
      paymentMethod: this.editPaymentMethod, isMinor: this.editIsMinor,
    };

    this.service.updateSocio(s.id, dto).subscribe({
      next: updated => {
        this.socio.set(updated);
        this.saving.set(false);
        this.editMode.set(false);
      },
      error: err => {
        this.saving.set(false);
        this.saveError.set(err?.error?.message ?? 'Errore durante il salvataggio.');
      },
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────
  askDelete(): void { this.confirmDelete.set(true); }
  cancelDeleteConfirm(): void { this.confirmDelete.set(false); }

  doDelete(): void {
    const id   = this.type() === 'socio' ? this.socio()?.id : this.admin()?.id;
    if (!id) return;
    this.deleteLoading.set(true);

    const req = this.type() === 'socio'
      ? this.service.deleteSocio(id)
      : this.service.deleteAdmin(id);

    req.subscribe({
      next: () => { this.router.navigate(['/dashboard/members']); },
      error: err => {
        this.deleteLoading.set(false);
        alert(err?.error?.message ?? 'Errore durante l\'eliminazione.');
        this.confirmDelete.set(false);
      },
    });
  }

  // ── Labels ────────────────────────────────────────────────────────────
  categoryLabel(c: string): string {
    return c === 'under26' ? 'Under 26' : c === 'sostenitore' ? 'Sostenitore' : 'Ordinario';
  }

  statusLabel(s: string): string {
    return s === 'in_attesa_pagamento' ? 'In attesa pagamento'
         : s === 'pagamento_in_corso'  ? 'Pagamento in corso'
         : s === 'attivo'              ? 'Attivo'
         : 'Rifiutato';
  }

  paymentLabel(p: string): string {
    return p === 'bonifico' ? 'Bonifico' : p === 'contanti' ? 'Contanti' : p;
  }

  docTypeLabel(d: string): string {
    return d === 'ci' ? "Carta d'identità"
         : d === 'passaporto' ? 'Passaporto'
         : d === 'patente'    ? 'Patente'
         : d;
  }
}

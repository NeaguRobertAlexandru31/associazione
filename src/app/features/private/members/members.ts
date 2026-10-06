import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth';
import { CreateMemberRequest, MemberListItem, MembersResponse } from '../../../core/models/member.model';
import { MembersService } from '../../../core/services/members/members';

interface CreateForm {
  isMinor: boolean;
  category: string; status: string;
  firstName: string; lastName: string; fiscalCode: string;
  birthDate: string; birthPlace: string; gender: string;
  docType: string; docNumber: string; docExpiry: string;
  email: string; phone: string;
  addressStreet: string; addressZip: string; addressCity: string; addressProvince: string;
  paymentMethod: string;
  privacyBase: boolean; privacyNewsletter: boolean; privacyThirdParties: boolean;
  guardianFirstName: string; guardianLastName: string; guardianFiscalCode: string;
  guardianRelation: string; guardianDocType: string; guardianDocNumber: string; guardianDocExpiry: string;
}

function emptyForm(): CreateForm {
  return {
    isMinor: false, category: 'ordinario', status: 'attivo',
    firstName: '', lastName: '', fiscalCode: '',
    birthDate: '', birthPlace: '', gender: 'm',
    docType: 'ci', docNumber: '', docExpiry: '',
    email: '', phone: '',
    addressStreet: '', addressZip: '', addressCity: '', addressProvince: '',
    paymentMethod: 'contanti',
    privacyBase: true, privacyNewsletter: false, privacyThirdParties: false,
    guardianFirstName: '', guardianLastName: '', guardianFiscalCode: '',
    guardianRelation: 'genitore', guardianDocType: 'ci', guardianDocNumber: '', guardianDocExpiry: '',
  };
}

@Component({
  selector: 'app-members',
  imports: [FormsModule],
  templateUrl: './members.html',
  styleUrl: './members.css',
})
export class Members implements OnInit {
  private membersService = inject(MembersService);
  private router         = inject(Router);
  private auth           = inject(AuthService);

  readonly isSuperAdmin = this.auth.isSuperAdmin;

  direttivo      = signal<MemberListItem[]>([]);
  soci           = signal<MemberListItem[]>([]);
  membersLoading = signal(true);
  membersError   = signal(false);

  confirmDeleteId = signal<string | null>(null);
  deleteLoading   = signal(false);

  showCreate  = signal(false);
  creating    = signal(false);
  createError = signal<string | null>(null);
  form: CreateForm = emptyForm();

  readonly categoryOptions  = [{ value: 'ordinario', label: 'Ordinario' }, { value: 'under26', label: 'Under 26' }, { value: 'sostenitore', label: 'Sostenitore' }];
  readonly statusOptions    = [{ value: 'in_attesa_pagamento', label: 'In attesa pagamento' }, { value: 'pagamento_in_corso', label: 'Pagamento in corso' }, { value: 'attivo', label: 'Attivo' }, { value: 'rifiutato', label: 'Rifiutato' }];
  readonly genderOptions    = [{ value: 'm', label: 'Maschio' }, { value: 'f', label: 'Femmina' }, { value: 'altro', label: 'Altro' }];
  readonly docTypeOptions   = [{ value: 'ci', label: "Carta d'identità" }, { value: 'passaporto', label: 'Passaporto' }, { value: 'patente', label: 'Patente' }];
  readonly paymentOptions   = [{ value: 'contanti', label: 'Contanti' }, { value: 'online', label: 'Online' }];
  readonly relationOptions  = [{ value: 'genitore', label: 'Genitore' }, { value: 'tutore_legale', label: 'Tutore legale' }];

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.membersLoading.set(true);
    this.membersService.getAll().subscribe({
      next: (res: MembersResponse) => {
        this.direttivo.set(res.direttivo);
        this.soci.set(res.soci);
        this.membersLoading.set(false);
      },
      error: () => {
        this.membersError.set(true);
        this.membersLoading.set(false);
      },
    });
  }

  goToMember(id: string): void { this.router.navigate(['/dashboard/members', id]); }

  askDelete(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.confirmDeleteId.set(id);
  }

  cancelDelete(): void { this.confirmDeleteId.set(null); }

  confirmDelete(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    this.deleteLoading.set(true);

    this.membersService.deleteMember(id).subscribe({
      next: () => {
        this.deleteLoading.set(false);
        this.cancelDelete();
        this.load();
      },
      error: err => {
        this.deleteLoading.set(false);
        alert(err?.error?.message ?? "Errore durante l'eliminazione.");
        this.cancelDelete();
      },
    });
  }

  openCreate(): void {
    this.form = emptyForm();
    this.createError.set(null);
    this.showCreate.set(true);
  }

  closeCreate(): void { this.showCreate.set(false); }

  submitCreate(): void {
    const f = this.form;
    this.creating.set(true);
    this.createError.set(null);

    const dto: CreateMemberRequest = {
      isMinor: f.isMinor,
      category: f.category as any,
      status: f.status as any,
      firstName: f.firstName,
      lastName: f.lastName,
      fiscalCode: f.fiscalCode,
      birthDate: f.birthDate,
      birthPlace: f.birthPlace,
      gender: f.gender,
      docType: f.docType,
      docNumber: f.docNumber,
      docExpiry: f.docExpiry,
      email: f.email,
      phone: f.phone,
      addressStreet: f.addressStreet,
      addressZip: f.addressZip,
      addressCity: f.addressCity,
      addressProvince: f.addressProvince,
      paymentMethod: f.paymentMethod,
      privacyBase: f.privacyBase,
      privacyNewsletter: f.privacyNewsletter,
      privacyThirdParties: f.privacyThirdParties,
      ...(f.isMinor && {
        guardian: {
          firstName: f.guardianFirstName,
          lastName: f.guardianLastName,
          fiscalCode: f.guardianFiscalCode,
          relation: f.guardianRelation,
          docType: f.guardianDocType,
          docNumber: f.guardianDocNumber,
          docExpiry: f.guardianDocExpiry,
        },
      }),
    };

    this.membersService.createMember(dto).subscribe({
      next: created => {
        this.creating.set(false);
        this.closeCreate();
        this.load();
        this.router.navigate(['/dashboard/members', created.id]);
      },
      error: err => {
        this.creating.set(false);
        this.createError.set(err?.error?.message ?? 'Errore durante la creazione.');
      },
    });
  }
}

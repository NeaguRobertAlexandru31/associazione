import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth/auth';
import { BOARD_ROLE_LABELS, BoardRole, MemberDetail, UpdateMemberRequest } from '../../../../core/models/member.model';
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

  loading = signal(true);
  error   = signal(false);
  member  = signal<MemberDetail | null>(null);

  showPrivate   = signal(false);
  editMode      = signal(false);
  saving        = signal(false);
  saveError     = signal<string | null>(null);
  confirmDelete = signal(false);
  deleteLoading = signal(false);

  editFirstName       = ''; editLastName        = '';
  editFiscalCode      = ''; editBirthDate       = ''; editBirthPlace  = '';
  editGender          = ''; editDocType         = ''; editDocNumber   = '';
  editDocExpiry       = ''; editEmail           = ''; editPhone       = '';
  editAddressStreet   = ''; editAddressZip      = '';
  editAddressCity     = ''; editAddressProvince = '';
  editCategory        = ''; editStatus          = ''; editPaymentMethod = '';
  editIsMinor         = false;

  readonly boardRoleOptions: { value: BoardRole; label: string }[] = [
    { value: 'presidente',          label: 'Presidente' },
    { value: 'vicepresidente',      label: 'Vicepresidente' },
    { value: 'segretario',          label: 'Segretario' },
    { value: 'tesoriere',           label: 'Tesoriere' },
    { value: 'consigliere',         label: 'Consigliere' },
    { value: 'revisore_dei_conti',  label: 'Revisore dei conti' },
    { value: 'responsabile_eventi', label: 'Responsabile eventi' },
  ];

  boardRolesSelected = signal<string[]>([]);
  boardRoleSaving    = signal(false);
  boardRoleSuccess   = signal(false);

  promoteRole   = signal<'MEMBER' | 'ADMIN' | 'SUPERADMIN' | ''>('');
  promoteSaving = signal(false);
  promoteError  = signal<string | null>(null);

  readonly categoryOptions  = [{ value: 'ordinario', label: 'Ordinario' }, { value: 'under26', label: 'Under 26' }, { value: 'sostenitore', label: 'Sostenitore' }];
  readonly statusOptions    = [{ value: 'in_attesa_pagamento', label: 'In attesa pagamento' }, { value: 'pagamento_in_corso', label: 'Pagamento in corso' }, { value: 'attivo', label: 'Attivo' }, { value: 'rifiutato', label: 'Rifiutato' }];
  readonly genderOptions    = [{ value: 'm', label: 'Maschio' }, { value: 'f', label: 'Femmina' }, { value: 'altro', label: 'Altro' }];
  readonly docTypeOptions   = [{ value: 'ci', label: 'Carta d\'identità' }, { value: 'passaporto', label: 'Passaporto' }, { value: 'patente', label: 'Patente' }];
  readonly paymentOptions   = [{ value: 'contanti', label: 'Contanti' }, { value: 'online', label: 'Online' }];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.getMember(id).subscribe({
      next: d => {
        this.member.set(d);
        this.boardRolesSelected.set(d.boardRoles ?? []);
        this.promoteRole.set(d.role as any);
        this.loading.set(false);
      },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }

  back(): void { this.router.navigate(['/dashboard/members']); }

  saveBoardRoles(): void {
    const m = this.member();
    if (!m) return;
    this.boardRoleSaving.set(true);
    this.auth.promoteRole(m.id, m.role, this.boardRolesSelected()).subscribe({
      next: updated => {
        this.member.update(cur => cur ? { ...cur, boardRoles: updated.boardRoles } : cur);
        this.boardRoleSaving.set(false);
        this.boardRoleSuccess.set(true);
        setTimeout(() => this.boardRoleSuccess.set(false), 2000);
      },
      error: () => this.boardRoleSaving.set(false),
    });
  }

  savePromoteRole(): void {
    const m    = this.member();
    const role = this.promoteRole();
    if (!m || !role) return;
    this.promoteSaving.set(true);
    this.promoteError.set(null);
    this.auth.promoteRole(m.id, role as any, role === 'MEMBER' ? [] : this.boardRolesSelected()).subscribe({
      next: updated => {
        this.member.update(cur => cur ? { ...cur, role: updated.role, boardRoles: updated.boardRoles } : cur);
        this.promoteSaving.set(false);
      },
      error: err => {
        this.promoteSaving.set(false);
        this.promoteError.set(err?.error?.message ?? 'Errore durante la modifica del ruolo.');
      },
    });
  }

  toggleBoardRole(value: string): void {
    this.boardRolesSelected.update(roles =>
      roles.includes(value) ? roles.filter(r => r !== value) : [...roles, value]
    );
  }

  togglePrivate(): void { this.showPrivate.update(v => !v); }

  mask(value: string | undefined | null): string {
    if (!value) return '—';
    return this.showPrivate() ? value : '••••••••';
  }

  startEdit(): void {
    const s = this.member();
    if (!s) return;
    this.editFirstName       = s.firstName;
    this.editLastName        = s.lastName;
    this.editFiscalCode      = s.fiscalCode ?? '';
    this.editBirthDate       = s.birthDate ? s.birthDate.substring(0, 10) : '';
    this.editBirthPlace      = s.birthPlace ?? '';
    this.editGender          = s.gender ?? '';
    this.editDocType         = s.docType ?? '';
    this.editDocNumber       = s.docNumber ?? '';
    this.editDocExpiry       = s.docExpiry ? s.docExpiry.substring(0, 10) : '';
    this.editEmail           = s.email;
    this.editPhone           = s.phone ?? '';
    this.editAddressStreet   = s.addressStreet ?? '';
    this.editAddressZip      = s.addressZip ?? '';
    this.editAddressCity     = s.addressCity ?? '';
    this.editAddressProvince = s.addressProvince ?? '';
    this.editCategory        = s.category;
    this.editStatus          = s.status;
    this.editPaymentMethod   = s.paymentMethod ?? '';
    this.editIsMinor         = s.isMinor ?? false;
    this.saveError.set(null);
    this.editMode.set(true);
  }

  cancelEdit(): void { this.editMode.set(false); this.saveError.set(null); }

  saveEdit(): void {
    const s = this.member();
    if (!s) return;
    this.saving.set(true);
    this.saveError.set(null);

    const dto: UpdateMemberRequest = {
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

    this.service.updateMember(s.id, dto).subscribe({
      next: updated => {
        this.member.set(updated);
        this.saving.set(false);
        this.editMode.set(false);
      },
      error: err => {
        this.saving.set(false);
        this.saveError.set(err?.error?.message ?? 'Errore durante il salvataggio.');
      },
    });
  }

  askDelete(): void { this.confirmDelete.set(true); }
  cancelDeleteConfirm(): void { this.confirmDelete.set(false); }

  doDelete(): void {
    const id = this.member()?.id;
    if (!id) return;
    this.deleteLoading.set(true);

    this.service.deleteMember(id).subscribe({
      next: () => { this.router.navigate(['/dashboard/members']); },
      error: err => {
        this.deleteLoading.set(false);
        alert(err?.error?.message ?? 'Errore durante l\'eliminazione.');
        this.confirmDelete.set(false);
      },
    });
  }

  boardRoleLabel(r: string | null | undefined): string {
    if (!r) return '—';
    return BOARD_ROLE_LABELS[r as BoardRole] ?? r;
  }

  boardRolesLabel(roles: string[] | undefined): string {
    if (!roles?.length) return '—';
    return roles.map(r => BOARD_ROLE_LABELS[r as BoardRole] ?? r).join(', ');
  }

  roleLabel(r: string): string {
    return r === 'SUPERADMIN' ? 'Presidente' : r === 'ADMIN' ? 'Direttivo' : 'Socio';
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

  docTypeLabel(d: string): string {
    return d === 'ci' ? "Carta d'identità"
         : d === 'passaporto' ? 'Passaporto'
         : d === 'patente'    ? 'Patente'
         : d;
  }
}

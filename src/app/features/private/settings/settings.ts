import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth/auth';
import { LucideAngularModule } from 'lucide-angular';
import { SiteSettingsService, SITE_IMAGE_KEYS, PLACEHOLDER_KEYS } from '../../../core/services/site-settings/site-settings';
import { MemberDetail } from '../../../core/models/member.model';

type SettingsView = 'member' | 'edit-member' | 'change-password' | 'delete' | 'images' | 'placeholders';

@Component({
  selector: 'app-settings',
  imports: [FormsModule, LucideAngularModule, DatePipe],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  private auth          = inject(AuthService);
  readonly siteSettings = inject(SiteSettingsService);
  readonly imageKeys    = SITE_IMAGE_KEYS;
  uploadingKey          = signal<string | null>(null);

  readonly isSuperAdmin    = this.auth.isSuperAdmin;
  readonly user            = this.auth.user;
  readonly placeholderKeys = PLACEHOLDER_KEYS;
  uploadingPlaceholderKey  = signal<string | null>(null);

  view = signal<SettingsView>('member');

  avatarUploading = signal(false);

  myMember      = signal<MemberDetail | null>(null);
  memberLoading = signal(false);

  editMemberFirstName    = signal('');
  editMemberLastName     = signal('');
  editMemberFiscalCode   = signal('');
  editMemberBirthDate    = signal('');
  editMemberBirthPlace   = signal('');
  editMemberGender       = signal('');
  editMemberDocType      = signal('');
  editMemberDocNumber    = signal('');
  editMemberDocExpiry    = signal('');
  editMemberPhone        = signal('');
  editMemberStreet       = signal('');
  editMemberZip          = signal('');
  editMemberCity         = signal('');
  editMemberProvince     = signal('');
  editMemberNewsletter   = signal(false);
  editMemberThirdParties = signal(false);
  editMemberLoading      = signal(false);
  editMemberError        = signal<string | null>(null);
  editMemberSuccess      = signal(false);

  pwdCurrent  = signal('');
  pwdNew      = signal('');
  pwdLoading  = signal(false);
  pwdError    = signal<string | null>(null);
  pwdSuccess  = signal(false);

  deletePassword = signal('');
  deleteLoading  = signal(false);
  deleteError    = signal<string | null>(null);

  ngOnInit(): void {
    this.siteSettings.load();
    this.loadMyMember();
  }

  private loadMyMember(): void {
    this.memberLoading.set(true);
    this.auth.getMyMember().subscribe({
      next: m => { this.myMember.set(m); this.memberLoading.set(false); },
      error: () => this.memberLoading.set(false),
    });
  }

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.avatarUploading.set(true);
    this.auth.uploadAvatar(file).subscribe({
      next: () => this.avatarUploading.set(false),
      error: () => this.avatarUploading.set(false),
    });
  }

  openEditMember(): void {
    const m = this.myMember();
    if (!m) return;
    this.editMemberFirstName.set(m.firstName ?? '');
    this.editMemberLastName.set(m.lastName ?? '');
    this.editMemberFiscalCode.set(m.fiscalCode ?? '');
    this.editMemberBirthDate.set(m.birthDate ? m.birthDate.slice(0, 10) : '');
    this.editMemberBirthPlace.set(m.birthPlace ?? '');
    this.editMemberGender.set(m.gender ?? '');
    this.editMemberDocType.set(m.docType ?? '');
    this.editMemberDocNumber.set(m.docNumber ?? '');
    this.editMemberDocExpiry.set(m.docExpiry ? m.docExpiry.slice(0, 10) : '');
    this.editMemberPhone.set(m.phone ?? '');
    this.editMemberStreet.set(m.addressStreet ?? '');
    this.editMemberZip.set(m.addressZip ?? '');
    this.editMemberCity.set(m.addressCity ?? '');
    this.editMemberProvince.set(m.addressProvince ?? '');
    this.editMemberNewsletter.set(m.privacyNewsletter ?? false);
    this.editMemberThirdParties.set(m.privacyThirdParties ?? false);
    this.editMemberError.set(null);
    this.editMemberSuccess.set(false);
    this.view.set('edit-member');
  }

  saveMyMember(): void {
    this.editMemberLoading.set(true);
    this.editMemberError.set(null);
    this.editMemberSuccess.set(false);

    this.auth.updateMyMember({
      firstName:           this.editMemberFirstName(),
      lastName:            this.editMemberLastName(),
      fiscalCode:          this.editMemberFiscalCode(),
      birthDate:           this.editMemberBirthDate(),
      birthPlace:          this.editMemberBirthPlace(),
      gender:              this.editMemberGender(),
      docType:             this.editMemberDocType(),
      docNumber:           this.editMemberDocNumber(),
      docExpiry:           this.editMemberDocExpiry(),
      phone:               this.editMemberPhone(),
      addressStreet:       this.editMemberStreet(),
      addressZip:          this.editMemberZip(),
      addressCity:         this.editMemberCity(),
      addressProvince:     this.editMemberProvince(),
      privacyNewsletter:   this.editMemberNewsletter(),
      privacyThirdParties: this.editMemberThirdParties(),
    }).subscribe({
      next: updated => {
        this.myMember.set(updated);
        this.editMemberLoading.set(false);
        this.editMemberSuccess.set(true);
        setTimeout(() => { this.editMemberSuccess.set(false); this.view.set('member'); }, 1500);
      },
      error: err => {
        this.editMemberLoading.set(false);
        this.editMemberError.set(err?.error?.message ?? 'Errore durante il salvataggio');
      },
    });
  }

  savePassword(): void {
    this.pwdLoading.set(true);
    this.pwdError.set(null);
    this.pwdSuccess.set(false);

    this.auth.updateProfile({ password: this.pwdNew(), currentPassword: this.pwdCurrent() }).subscribe({
      next: () => {
        this.pwdLoading.set(false);
        this.pwdSuccess.set(true);
        this.pwdCurrent.set('');
        this.pwdNew.set('');
        setTimeout(() => { this.pwdSuccess.set(false); this.view.set('member'); }, 1500);
      },
      error: err => {
        this.pwdLoading.set(false);
        this.pwdError.set(err?.error?.message ?? 'Errore durante il salvataggio');
      },
    });
  }

  confirmDelete(): void {
    this.deleteLoading.set(true);
    this.deleteError.set(null);

    this.auth.deleteProfile(this.deletePassword()).subscribe({
      next: () => {
        this.auth.logout();
        window.location.href = '/login';
      },
      error: err => {
        this.deleteLoading.set(false);
        this.deleteError.set(err?.error?.message ?? 'Errore durante l\'eliminazione');
      },
    });
  }

  onImageFileSelected(key: string, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingKey.set(key);
    this.siteSettings.uploadImage(file).subscribe({
      next: res => {
        const url = res.urls[0];
        this.siteSettings.set(key, url).subscribe({
          next: () => {
            this.siteSettings.settings.update(s => ({ ...s, [key]: url }));
            this.uploadingKey.set(null);
          },
          error: () => this.uploadingKey.set(null),
        });
      },
      error: () => this.uploadingKey.set(null),
    });
  }

  onPlaceholderFileSelected(key: string, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingPlaceholderKey.set(key);
    this.siteSettings.uploadPlaceholder(file).subscribe({
      next: res => {
        const url = res.urls[0];
        this.siteSettings.set(key, url).subscribe({
          next: () => {
            this.siteSettings.settings.update(s => ({ ...s, [key]: url }));
            this.uploadingPlaceholderKey.set(null);
          },
          error: () => this.uploadingPlaceholderKey.set(null),
        });
      },
      error: () => this.uploadingPlaceholderKey.set(null),
    });
  }
}

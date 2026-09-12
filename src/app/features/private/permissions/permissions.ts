import { Component, OnInit, inject, signal } from '@angular/core';
import { MembersService } from '../../../core/services/members/members';
import { PermissionsService } from '../../../core/services/permissions/permissions';
import { MemberListItem, DashboardPage, PagePermissions } from '../../../core/models/member.model';

interface AdminRow {
  member: MemberListItem;
  permissions: Record<DashboardPage, boolean>;
  saving: boolean;
  saved: boolean;
  error: string | null;
}

const MANAGED_PAGES: { page: DashboardPage; label: string }[] = [
  { page: 'overview',   label: 'Panoramica'    },
  { page: 'members',    label: 'Soci'          },
  { page: 'events',     label: 'Calendario'    },
  { page: 'messages',   label: 'Messaggi'      },
  { page: 'activities', label: 'Attività'      },
  { page: 'news',       label: 'Contenuti'     },
  { page: 'projects',   label: 'Progetti'      },
  { page: 'donations',  label: 'Donazioni'     },
];

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [],
  templateUrl: './permissions.html',
})
export class Permissions implements OnInit {
  private membersService = inject(MembersService);
  private permsService   = inject(PermissionsService);

  readonly pages = MANAGED_PAGES;
  rows   = signal<AdminRow[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.membersService.getAll().subscribe({
      next: res => {
        const admins = res.direttivo.filter(m => m.role === 'ADMIN');
        this.rows.set(admins.map(m => ({
          member: m,
          permissions: this.buildPermissions(m.pagePermissions),
          saving: false,
          saved: false,
          error: null,
        })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggle(row: AdminRow, page: DashboardPage): void {
    row.permissions[page] = !row.permissions[page];
    this.rows.update(r => [...r]);
  }

  save(row: AdminRow): void {
    row.saving = true;
    row.saved  = false;
    row.error  = null;
    this.rows.update(r => [...r]);

    this.permsService.updatePermissions(row.member.id, row.permissions).subscribe({
      next: () => {
        row.saving = false;
        row.saved  = true;
        this.rows.update(r => [...r]);
        setTimeout(() => { row.saved = false; this.rows.update(r => [...r]); }, 2000);
      },
      error: err => {
        row.saving = false;
        row.error  = err?.error?.message ?? 'Errore durante il salvataggio';
        this.rows.update(r => [...r]);
      },
    });
  }

  private buildPermissions(stored: PagePermissions | null | undefined): Record<DashboardPage, boolean> {
    const base = {} as Record<DashboardPage, boolean>;
    for (const { page } of MANAGED_PAGES) {
      base[page] = stored?.[page] === true;
    }
    return base;
  }
}

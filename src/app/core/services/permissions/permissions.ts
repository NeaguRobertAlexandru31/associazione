import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../auth/auth';
import { DashboardPage, PagePermissions } from '../../models/member.model';

export interface NavPage {
  page: DashboardPage;
  route: string;
  icon: string;
  label: string;
  badge?: number;
}

const ALL_PAGES: Omit<NavPage, 'badge'>[] = [
  { page: 'overview',     route: '/dashboard/overview',     icon: 'dashboard',          label: 'Panoramica'    },
  { page: 'tessera',      route: '/dashboard/tessera',      icon: 'badge',              label: 'Tessera'       },
  { page: 'members',      route: '/dashboard/members',      icon: 'group',              label: 'Soci'          },
  { page: 'events',       route: '/dashboard/events',       icon: 'calendar_month',     label: 'Calendario'    },
  { page: 'messages',     route: '/dashboard/messages',     icon: 'mail',               label: 'Messaggi'      },
  { page: 'activities',   route: '/dashboard/activities',   icon: 'history',            label: 'Attività'      },
  { page: 'news',         route: '/dashboard/news',         icon: 'article',            label: 'Contenuti'     },
  { page: 'projects',     route: '/dashboard/projects',     icon: 'folder_open',        label: 'Progetti'      },
  { page: 'donations',    route: '/dashboard/donations',    icon: 'volunteer_activism', label: 'Donazioni'     },
  { page: 'settings',     route: '/dashboard/settings',     icon: 'settings',           label: 'Impostazioni'  },
  { page: 'permissions',  route: '/dashboard/permissions',  icon: 'admin_panel_settings', label: 'Permessi'    },
];

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private auth = inject(AuthService);
  private http  = inject(HttpClient);

  readonly visiblePages = computed((): DashboardPage[] => {
    const user = this.auth.user();
    if (!user) return [];

    if (user.role === 'SUPERADMIN') {
      return ALL_PAGES.map(p => p.page);
    }

    if (user.role === 'ADMIN') {
      const perms: PagePermissions = user.pagePermissions ?? {};
      return ALL_PAGES
        .filter(p => p.page !== 'permissions' && (p.page === 'settings' || p.page === 'tessera' || perms[p.page] === true))
        .map(p => p.page);
    }

    if (user.role === 'MEMBER') {
      return ['tessera', 'settings'];
    }

    return [];
  });

  canAccess(page: DashboardPage): boolean {
    return this.visiblePages().includes(page);
  }

  getNavItems(badgeMap: Partial<Record<DashboardPage, number>> = {}): NavPage[] {
    return this.visiblePages()
      .map(page => {
        const def = ALL_PAGES.find(p => p.page === page)!;
        return { ...def, badge: badgeMap[page] };
      });
  }

  updatePermissions(memberId: string, pagePermissions: Record<string, boolean>): Observable<unknown> {
    return this.http.patch(
      `${environment.apiUrl}/auth/members/${memberId}/permissions`,
      { pagePermissions },
    );
  }
}

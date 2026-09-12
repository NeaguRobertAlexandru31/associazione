import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DashboardPage } from '../models/member.model';
import { PermissionsService } from '../services/permissions/permissions';
import { AuthService } from '../services/auth/auth';

export function roleGuard(page: DashboardPage): CanActivateFn {
  return () => {
    const perms  = inject(PermissionsService);
    const auth   = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
    if (perms.canAccess(page)) return true;

    const visible = perms.visiblePages();
    if (visible.length > 0) {
      return router.createUrlTree([`/dashboard/${visible[0]}`]);
    }
    return router.createUrlTree(['/dashboard/settings']);
  };
}

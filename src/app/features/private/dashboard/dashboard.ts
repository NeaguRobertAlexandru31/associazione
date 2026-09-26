import { Component, OnInit, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth';
import { UnreadCountService } from '../../../core/services/contact/unread-count';
import { PermissionsService } from '../../../core/services/permissions/permissions';
import { SiteSettingsService } from '../../../core/services/site-settings/site-settings';
import { SidebarUser } from '../../../shared/components/private/sidebar/sidebar';
import { DashFab } from '../../../shared/components/private/dash-fab/dash-fab';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, RouterLink, DashFab],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  private auth         = inject(AuthService);
  private router       = inject(Router);
  private unreadCount  = inject(UnreadCountService);
  private perms        = inject(PermissionsService);
  readonly siteSettings = inject(SiteSettingsService);

  readonly fabUser = computed((): SidebarUser | null => {
    const u = this.auth.user();
    if (!u) return null;
    return { name: `${u.firstName} ${u.lastName}`, email: u.email, profileImage: u.profileImage };
  });

  readonly navItems = computed(() =>
    this.perms.getNavItems({ messages: this.unreadCount.count() })
  );

  readonly assocName  = computed(() => this.siteSettings.settings()['association_name'] ?? '');
  readonly assocLogo  = computed(() => this.siteSettings.settings()['association_logo'] ?? '');

  ngOnInit(): void {
    this.unreadCount.load();
    this.siteSettings.load();
  }

  logout(): void { this.auth.logout(); this.router.navigate(['/login']); }
}

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth/auth';
import { UnreadCountService } from '../../../core/services/contact/unread-count';
import { PermissionsService } from '../../../core/services/permissions/permissions';
import { SiteSettingsService } from '../../../core/services/site-settings/site-settings';
import { SidebarUser } from '../../../shared/components/private/sidebar/sidebar';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  private auth         = inject(AuthService);
  private router       = inject(Router);
  private unreadCount  = inject(UnreadCountService);
  private perms        = inject(PermissionsService);
  readonly siteSettings = inject(SiteSettingsService);

  menuOpen    = signal(false);
  menuVisible = signal(false);

  readonly fabUser = computed((): SidebarUser | null => {
    const u = this.auth.user();
    if (!u) return null;
    return { name: `${u.firstName} ${u.lastName}`, email: u.email, profileImage: u.profileImage };
  });

  readonly navItems = computed(() =>
    this.perms.getNavItems({ messages: this.unreadCount.count() })
  );

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.closeMenu());
  }

  ngOnInit(): void {
    this.unreadCount.load();
    this.siteSettings.load();
  }

  toggleMenu(): void {
    this.menuOpen() ? this.closeMenu() : this.openMenu();
  }

  openMenu(): void {
    this.menuVisible.set(true);
    requestAnimationFrame(() => this.menuOpen.set(true));
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    setTimeout(() => this.menuVisible.set(false), 400);
  }

  logout(): void {
    this.closeMenu();
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

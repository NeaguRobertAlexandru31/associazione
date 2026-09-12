import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth';
import { UnreadCountService } from '../../../core/services/contact/unread-count';
import { PermissionsService } from '../../../core/services/permissions/permissions';
import { Sidebar, SidebarItem, SidebarUser } from '../../../shared/components/private/sidebar/sidebar';
import { PrivateNavbar } from '../../../shared/components/private/navbar/navbar';

@Component({
  selector: 'app-dashboard',
  imports: [Sidebar, PrivateNavbar, RouterOutlet],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})

export class Dashboard implements OnInit {

  private auth        = inject(AuthService);
  private router      = inject(Router);
  private unreadCount = inject(UnreadCountService);
  private perms       = inject(PermissionsService);

  readonly sidebarUser = computed((): SidebarUser | null => {
    const u = this.auth.user();
    if (!u) return null;
    return { name: `${u.firstName} ${u.lastName}`, email: u.email, profileImage: u.profileImage };
  });
  sidebarOpen = signal(false);

  readonly navItems = computed((): SidebarItem[] =>
    this.perms.getNavItems({ messages: this.unreadCount.count() })
  );

  ngOnInit(): void {
    this.unreadCount.load();
  }

  logout(): void { this.auth.logout(); this.router.navigate(['/login']); }
}

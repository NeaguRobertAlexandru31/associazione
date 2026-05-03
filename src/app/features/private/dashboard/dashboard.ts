import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth';
import { UnreadCountService } from '../../../core/services/contact/unread-count';
import { Sidebar, SidebarItem } from '../../../shared/components/private/sidebar/sidebar';
import { PrivateNavbar } from '../../../shared/components/private/navbar/navbar';

@Component({
  selector: 'app-dashboard',
  imports: [Sidebar, PrivateNavbar, RouterOutlet],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})

export class Dashboard implements OnInit {

  private auth            = inject(AuthService);
  private router          = inject(Router);
  private unreadCount     = inject(UnreadCountService);

  readonly user = this.auth.user;
  sidebarOpen = signal(false);

  readonly navItems = computed((): SidebarItem[] => [
    { route: '/dashboard/overview',  icon: 'dashboard',          label: 'Panoramica'  },
    { route: '/dashboard/members',   icon: 'group',              label: 'Soci'        },
    { route: '/dashboard/events',    icon: 'calendar_month',     label: 'Calendario'  },
    { route: '/dashboard/messages',   icon: 'mail',               label: 'Messaggi',   badge: this.unreadCount.count() },
    { route: '/dashboard/activities', icon: 'history',            label: 'Attività'    },
    { route: '/dashboard/news',       icon: 'article',            label: 'Contenuti'   },
    { route: '/dashboard/donations', icon: 'volunteer_activism', label: 'Donazioni'   },
    { route: '/dashboard/settings',  icon: 'settings',           label: 'Impostazioni'},
  ]);

  ngOnInit(): void {
    this.unreadCount.load();
  }

  logout(): void { this.auth.logout(); this.router.navigate(['/login']); }
}

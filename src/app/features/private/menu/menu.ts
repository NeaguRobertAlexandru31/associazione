import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PermissionsService } from '../../../core/services/permissions/permissions';
import { UnreadCountService } from '../../../core/services/contact/unread-count';

const PAGE_COLORS: Record<string, { bg: string; icon: string; border: string }> = {
  overview:    { bg: '#eff6ff', icon: '#3b82f6', border: '#bfdbfe' },
  tessera:     { bg: '#fffbeb', icon: '#f59e0b', border: '#fde68a' },
  members:     { bg: '#f5f3ff', icon: '#8b5cf6', border: '#ddd6fe' },
  events:      { bg: '#ecfdf5', icon: '#10b981', border: '#a7f3d0' },
  messages:    { bg: '#f0f9ff', icon: '#0ea5e9', border: '#bae6fd' },
  activities:  { bg: '#f8fafc', icon: '#64748b', border: '#cbd5e1' },
  news:        { bg: '#fff7ed', icon: '#f97316', border: '#fed7aa' },
  projects:    { bg: '#f0fdfa', icon: '#14b8a6', border: '#99f6e4' },
  documents:   { bg: '#ecfeff', icon: '#06b6d4', border: '#a5f3fc' },
  donations:   { bg: '#fff1f2', icon: '#f43f5e', border: '#fecdd3' },
  settings:    { bg: '#fafafa', icon: '#71717a', border: '#d4d4d8' },
  permissions: { bg: '#fef2f2', icon: '#ef4444', border: '#fecaca' },
  services:    { bg: '#eef2ff', icon: '#6366f1', border: '#c7d2fe' },
  'doc-scan':  { bg: '#f7fee7', icon: '#65a30d', border: '#d9f99d' },
};

@Component({
  selector: 'app-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {
  private perms  = inject(PermissionsService);
  private unread = inject(UnreadCountService);

  readonly items = computed(() =>
    this.perms.getNavItems({ messages: this.unread.count() }).map(item => ({
      ...item,
      colors: PAGE_COLORS[item.page] ?? { bg: 'hover:bg-surface-container', icon: 'text-primary', border: 'hover:border-outline-variant' },
    }))
  );
}

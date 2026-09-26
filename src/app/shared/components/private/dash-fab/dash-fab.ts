import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarItem, SidebarUser } from '../sidebar/sidebar';

@Component({
  selector: 'app-dash-fab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './dash-fab.html',
})
export class DashFab {
  @Input() items: SidebarItem[] = [];
  @Input() user: SidebarUser | null = null;
  @Output() logoutClick = new EventEmitter<void>();
  @Output() itemClick   = new EventEmitter<void>();

  open    = signal(false);
  visible = signal(false); // controlla la presenza nel DOM

  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  toggle(): void {
    this.open() ? this.close() : this.openMenu();
  }

  openMenu(): void {
    if (this.closeTimer) { clearTimeout(this.closeTimer); this.closeTimer = null; }
    this.visible.set(true);
    // un frame di ritardo per far partire la transizione CSS dopo che il DOM è pronto
    requestAnimationFrame(() => this.open.set(true));
  }

  close(): void {
    if (this.closeTimer) { clearTimeout(this.closeTimer); this.closeTimer = null; }
    this.open.set(false);
    this.visible.set(false);
  }

  onItemClick(): void {
    if (this.closeTimer) { clearTimeout(this.closeTimer); this.closeTimer = null; }
    this.open.set(false);
    this.visible.set(false);
    this.itemClick.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.open()) this.close(); }
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface SidebarItem {
  route: string;
  icon: string;
  label: string;
  badge?: number;
}

export interface SidebarUser {
  name: string;
  email: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  @Input() items: SidebarItem[] = [];
  @Input() user: SidebarUser | null = null;
  @Output() logoutClick = new EventEmitter<void>();
  @Output() itemClick   = new EventEmitter<void>();
}

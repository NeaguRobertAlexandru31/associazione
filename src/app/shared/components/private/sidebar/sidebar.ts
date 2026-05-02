import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface SidebarItem {
  id: string;
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
  imports: [RouterLink],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  @Input() items: SidebarItem[] = [];
  @Input() activeId = '';
  @Input() user: SidebarUser | null = null;
  @Output() tabChange = new EventEmitter<string>();
  @Output() logoutClick = new EventEmitter<void>();
}

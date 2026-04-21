import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-private-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class PrivateNavbar {
  @Input() title = 'Pannello';
  @Output() menuClick  = new EventEmitter<void>();
  @Output() logoutClick = new EventEmitter<void>();
}

import { Component, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-home',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  parallaxOffset = 0;

  @HostListener('window:scroll')
  onScroll(): void {
    this.parallaxOffset = window.scrollY * 0.25;
  }
}

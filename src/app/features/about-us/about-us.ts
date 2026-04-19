import { Component, HostListener } from '@angular/core';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-about-us',
  imports: [TranslatePipe],
  templateUrl: './about-us.html',
  styleUrl: './about-us.css',
})
export class AboutUs {
  parallaxOffset = 0;

  @HostListener('window:scroll')
  onScroll(): void {
    this.parallaxOffset = window.scrollY * 0.25;
  }
}

import { AfterViewInit, Component, ElementRef, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { TranslationService, Lang } from '../../../i18n/translation.service';

export interface NavItem {
  route: string;
  labelKey: string;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements AfterViewInit {
  private translationService = inject(TranslationService);

  readonly navItems: NavItem[] = [
    { route: '/about-us',  labelKey: 'nav.about-us'  },
    { route: '/boutique',  labelKey: 'nav.boutique'  },
    { route: '/events',    labelKey: 'nav.events'     },
    { route: '/news',      labelKey: 'nav.news'       },
    { route: '/projects',  labelKey: 'nav.projects'   },
  ];

  readonly langs: Lang[] = ['it', 'ro'];

  get currentLang(): Lang {
    return this.translationService.currentLang();
  }

  setLang(lang: Lang): void {
    this.translationService.setLang(lang);
  }

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    const height = this.el.nativeElement.offsetHeight;
    document.documentElement.style.setProperty('--navbar-height', `${height}px`);
  }
}

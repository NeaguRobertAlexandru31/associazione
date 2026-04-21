import { AfterViewInit, Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TranslatePipe } from '../../../../i18n/translate.pipe';
import { TranslationService, Lang } from '../../../../i18n/translation.service';

export interface NavItem {
  route: string;
  labelKey: string;
}

export interface LangOption {
  code: Lang;
  label: string;
  flag: string;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements AfterViewInit {
  private router = inject(Router);
  private translationService = inject(TranslationService);

  readonly navItems: NavItem[] = [
    { route: '/about-us', labelKey: 'nav.about-us' },
    { route: '/boutique', labelKey: 'nav.boutique'  },
    { route: '/events',   labelKey: 'nav.events'    },
    { route: '/news',     labelKey: 'nav.news'       },
    { route: '/projects', labelKey: 'nav.projects'  },
  ];

  readonly langs: LangOption[] = [
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'ro', label: 'Română',   flag: '🇷🇴' },
  ];

  menuOpen       = signal(false);
  langDropdownOpen = signal(false);

  get currentLang(): Lang { return this.translationService.currentLang(); }
  get currentLangOpt(): LangOption { return this.langs.find(l => l.code === this.currentLang)!; }

  constructor(private el: ElementRef<HTMLElement>) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.menuOpen.set(false);
        this.langDropdownOpen.set(false);
      });
  }

  toggleMenu(): void { this.menuOpen.update(v => !v); }

  toggleLangDropdown(e: Event): void {
    e.stopPropagation();
    this.langDropdownOpen.update(v => !v);
  }

  setLang(lang: Lang): void {
    this.translationService.setLang(lang);
    this.langDropdownOpen.set(false);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.langDropdownOpen.set(false);
  }

  ngAfterViewInit(): void {
    const height = this.el.nativeElement.offsetHeight;
    document.documentElement.style.setProperty('--navbar-height', `${height}px`);
  }
}

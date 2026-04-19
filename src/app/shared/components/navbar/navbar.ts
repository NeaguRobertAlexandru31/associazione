import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '../../../i18n/translate.pipe';

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
export class Navbar {
  readonly navItems: NavItem[] = [
    { route: '/about-us',  labelKey: 'nav.about-us'  },
    { route: '/donations', labelKey: 'nav.donations'  },
    { route: '/events',    labelKey: 'nav.events'     },
    { route: '/news',      labelKey: 'nav.news'       },
    { route: '/projects',  labelKey: 'nav.projects'   },
  ];
}

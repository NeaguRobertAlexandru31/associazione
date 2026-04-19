import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../i18n/translate.pipe';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  readonly stats = [
    { value: '500+', labelKey: 'footer.stat_members'  },
    { value: '15',   labelKey: 'footer.stat_projects' },
    { value: '30+',  labelKey: 'footer.stat_events'   },
  ];

  readonly navLinks = [
    { labelKey: 'nav.about-us',   route: '/about-us'  },
    { labelKey: 'nav.events',     route: '/events'    },
    { labelKey: 'nav.projects',   route: '/projects'  },
    { labelKey: 'nav.news',       route: '/news'      },
    { labelKey: 'nav.donations',  route: '/donations' },
  ];

  readonly legalLinks = [
    { labelKey: 'footer.privacy',   route: '/documents' },
    { labelKey: 'footer.terms',     route: '/documents' },
    { labelKey: 'footer.statuto',   route: '/documents' },
    { labelKey: 'footer.press_kit', route: '/documents' },
    { labelKey: 'footer.contacts',  route: '/contacts'  },
  ];
}

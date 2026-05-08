import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../i18n/translate.pipe';
import { PublicStats, StatsService } from '../../../../core/services/stats/stats';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer implements OnInit {
  private statsService = inject(StatsService);

  stats = signal<PublicStats | null>(null);

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

  ngOnInit(): void {
    this.statsService.getPublic().subscribe({
      next: s  => this.stats.set(s),
      error: () => {},
    });
  }
}

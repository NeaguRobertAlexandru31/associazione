import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { Article } from '../../../core/models/article.model';
import { ArticlesService } from '../../../core/services/articles/articles';
import { SiteSettingsService } from '../../../core/services/site-settings/site-settings';
import { ArticleCard } from '../../../shared/components/public/article/article';


@Component({
  selector: 'app-news',
  imports: [TranslatePipe, ArticleCard],
  templateUrl: './news.html',
  styleUrl: './news.css',
})
export class News implements OnInit {
  private articlesService = inject(ArticlesService);
  readonly siteSettings   = inject(SiteSettingsService);

  articles     = signal<Article[]>([]);
  loading      = signal(true);
  activeFilter = signal('all');

  readonly filters = [
    { value: 'all',         label: 'Tutti'        },
    { value: 'cultura',     label: 'Cultura'      },
    { value: 'letteratura', label: 'Letteratura'  },
    { value: 'artigianato', label: 'Artigianato'  },
    { value: 'comunita',    label: 'Comunità'     },
    { value: 'educazione',  label: 'Educazione'   },
    { value: 'tradizione',  label: 'Tradizione'   },
    { value: 'sociale',     label: 'Sociale'      },
  ];

  readonly filtered = computed(() => {
    const f = this.activeFilter();
    if (f === 'all') return this.articles();
    return this.articles().filter(a => a.categories.includes(f));
  });

  readonly grid = computed(() => this.filtered());

  ngOnInit(): void {
    this.siteSettings.load();
    this.articlesService.getAll().subscribe({
      next: arts => { this.articles.set(arts); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  setFilter(value: string): void { this.activeFilter.set(value); }
}

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { Article } from '../../../core/models/article.model';
import { ArticlesService } from '../../../core/services/articles/articles';
import { environment } from '../../../../environments/environment';


@Component({
  selector: 'app-news',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './news.html',
  styleUrl: './news.css',
})
export class News implements OnInit {
  private articlesService = inject(ArticlesService);

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

  readonly featured = computed(() => this.filtered()[0] ?? null);
  readonly grid     = computed(() => this.filtered().slice(1));

  ngOnInit(): void {
    this.articlesService.getAll().subscribe({
      next: arts => { this.articles.set(arts); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  setFilter(value: string): void { this.activeFilter.set(value); }

  coverImage(a: Article): string {
    const img = a.images[0];
    if (!img) return '/img/hero.jpg';
    return img.startsWith('http') ? img : `${environment.apiUrl}${img}`;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  firstCategory(a: Article): string {
    return a.categories[0] ?? '';
  }

  apiBase = environment.apiUrl.replace('/api', '');
}

import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Article as ArticleModel } from '../../../../core/models/article.model';
import { SiteSettingsService } from '../../../../core/services/site-settings/site-settings';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-article',
  imports: [RouterLink],
  templateUrl: './article.html',
  styleUrl: './article.css',
})
export class ArticleCard {
  private siteSettings = inject(SiteSettingsService);
  article = input.required<ArticleModel>();

  readonly coverImage = computed(() => {
    const a = this.article();
    const img = a.cover ?? a.blocks?.[0]?.image ?? null;
    if (!img) return this.siteSettings.placeholder('placeholder_page_hero');
    return img.startsWith('http') ? img : `${environment.apiUrl}${img}`;
  });

  readonly previewText = computed(() => this.article().blocks?.[0]?.paragraph ?? '');

  readonly firstCategory = computed(() => this.article().categories[0] ?? '');

  readonly formatDate = computed(() =>
    new Date(this.article().createdAt).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  );
}

import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Article as ArticleModel } from '../../../../core/models/article.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-article',
  imports: [RouterLink],
  templateUrl: './article.html',
  styleUrl: './article.css',
})
export class ArticleCard {
  article = input.required<ArticleModel>();

  readonly coverImage = computed(() => {
    const img = this.article().images[0];
    if (!img) return '/img/hero.jpg';
    return img.startsWith('http') ? img : `${environment.apiUrl}${img}`;
  });

  readonly firstCategory = computed(() => this.article().categories[0] ?? '');

  readonly formatDate = computed(() =>
    new Date(this.article().createdAt).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  );
}

import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../i18n/translate.pipe';

export interface NewsItem {
  img: string;
  category: 'cultura' | 'letteratura' | 'artigianato' | 'comunita' | 'educazione';
  categoryKey: string;
  dateKey: string;
  titleKey: string;
  descKey: string;
}

export interface NewsFilter {
  value: string;
  labelKey: string;
}

@Component({
  selector: 'app-news',
  imports: [RouterLink, FormsModule, TranslatePipe],
  templateUrl: './news.html',
  styleUrl: './news.css',
})
export class News {
  readonly filters: NewsFilter[] = [
    { value: 'all',          labelKey: 'news.filter_all'          },
    { value: 'cultura',      labelKey: 'news.filter_cultura'      },
    { value: 'letteratura',  labelKey: 'news.filter_letteratura'  },
    { value: 'artigianato',  labelKey: 'news.filter_artigianato'  },
    { value: 'comunita',     labelKey: 'news.filter_comunita'     },
    { value: 'educazione',   labelKey: 'news.filter_educazione'   },
  ];

  readonly allNews: NewsItem[] = [
    { img: '/img/hero.jpg',       category: 'cultura',     categoryKey: 'news.filter_cultura',     dateKey: 'news.n1_date', titleKey: 'news.n1_title', descKey: 'news.n1_desc' },
    { img: '/img/member2.jpg',    category: 'letteratura', categoryKey: 'news.filter_letteratura', dateKey: 'news.n2_date', titleKey: 'news.n2_title', descKey: 'news.n2_desc' },
    { img: '/img/member3.jpg',    category: 'artigianato', categoryKey: 'news.filter_artigianato', dateKey: 'news.n3_date', titleKey: 'news.n3_title', descKey: 'news.n3_desc' },
    { img: '/img/member4.jpg',    category: 'comunita',    categoryKey: 'news.filter_comunita',    dateKey: 'news.n4_date', titleKey: 'news.n4_title', descKey: 'news.n4_desc' },
    { img: '/img/about-hero.jpg', category: 'cultura',     categoryKey: 'news.filter_cultura',     dateKey: 'news.n5_date', titleKey: 'news.n5_title', descKey: 'news.n5_desc' },
    { img: '/img/member1.jpg',    category: 'educazione',  categoryKey: 'news.filter_educazione',  dateKey: 'news.n6_date', titleKey: 'news.n6_title', descKey: 'news.n6_desc' },
    { img: '/img/hero.jpg',       category: 'artigianato', categoryKey: 'news.filter_artigianato', dateKey: 'news.n7_date', titleKey: 'news.n7_title', descKey: 'news.n7_desc' },
    { img: '/img/member2.jpg',    category: 'letteratura', categoryKey: 'news.filter_letteratura', dateKey: 'news.n8_date', titleKey: 'news.n8_title', descKey: 'news.n8_desc' },
    { img: '/img/member3.jpg',    category: 'comunita',    categoryKey: 'news.filter_comunita',    dateKey: 'news.n9_date', titleKey: 'news.n9_title', descKey: 'news.n9_desc' },
  ];

  activeFilter = signal('all');

  filteredNews = computed(() =>
    this.activeFilter() === 'all'
      ? this.allNews
      : this.allNews.filter(n => n.category === this.activeFilter())
  );

  readonly featured: NewsItem = this.allNews[0];

  readonly grid = computed(() =>
    this.activeFilter() === 'all' ? this.allNews.slice(1) : this.filteredNews()
  );

  setFilter(value: string): void {
    this.activeFilter.set(value);
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { SiteSettingsService } from '../../../core/services/site-settings/site-settings';

export interface Product {
  img: string;
  categoryKey: string;
  titleKey: string;
  authorKey: string;
  descKey: string;
  priceKey: string;
  originalPriceKey?: string;
  isNew?: boolean;
  isFavorited?: boolean;
}

@Component({
  selector: 'app-boutique',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './boutique.html',
  styleUrl: './boutique.css',
})
export class Boutique implements OnInit {
  readonly siteSettings = inject(SiteSettingsService);
  ngOnInit(): void { this.siteSettings.load(); }

  readonly featured: Product = {
    img: '/img/member2.jpg',
    categoryKey: 'boutique.p1_category',
    titleKey: 'boutique.p1_title',
    authorKey: 'boutique.p1_author',
    descKey: 'boutique.p1_desc',
    priceKey: 'boutique.p1_price',
    originalPriceKey: 'boutique.p1_original_price',
    isNew: true,
  };

  readonly sideProduct: Product = {
    img: '/img/member3.jpg',
    categoryKey: 'boutique.p2_category',
    titleKey: 'boutique.p2_title',
    authorKey: 'boutique.p2_author',
    descKey: 'boutique.p2_desc',
    priceKey: 'boutique.p2_price',
    isFavorited: true,
  };

  readonly categories = [
    { img: '/img/hero.jpg',        titleKey: 'boutique.cat_craft_title',  descKey: 'boutique.cat_craft_desc',  bg: '',         large: true  },
    { img: '',                     titleKey: 'boutique.cat_books_title',   descKey: 'boutique.cat_books_desc',  bg: 'primary',  large: false, icon: 'menu_book' },
    { img: '',                     titleKey: 'boutique.cat_fashion_title', descKey: 'boutique.cat_fashion_desc', bg: 'secondary', large: false, icon: 'apparel'  },
  ];

  favorited = signal(false);

  get favIconStyle(): string {
    return this.favorited() ? "'FILL' 1" : "'FILL' 0";
  }

  toggleFavorite(): void {
    this.favorited.update(v => !v);
  }
}

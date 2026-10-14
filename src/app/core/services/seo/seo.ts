import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SeoData } from '../../models/seo.model';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta  = inject(Meta);

  apply(seo: SeoData, coverUrl?: string): void {
    this.title.setTitle(seo.title);

    this.meta.updateTag({ name: 'description',        content: seo.description });
    this.meta.updateTag({ name: 'keywords',           content: seo.keywords.join(', ') });

    this.meta.updateTag({ property: 'og:title',       content: seo.title });
    this.meta.updateTag({ property: 'og:description', content: seo.ogDescription });
    this.meta.updateTag({ property: 'og:type',        content: 'website' });

    if (coverUrl) {
      this.meta.updateTag({ property: 'og:image',    content: coverUrl });
      this.meta.updateTag({ name: 'twitter:image',   content: coverUrl });
    }

    this.meta.updateTag({ name: 'twitter:card',        content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title',       content: seo.title });
    this.meta.updateTag({ name: 'twitter:description', content: seo.ogDescription });
  }

  reset(): void {
    const defaultTitle = 'Marama APS ETS';
    this.title.setTitle(defaultTitle);
    this.meta.updateTag({ name: 'description',        content: 'Associazione di promozione sociale della cultura rumena in Italia' });
    this.meta.removeTag('name="keywords"');
    this.meta.removeTag('property="og:title"');
    this.meta.removeTag('property="og:description"');
    this.meta.removeTag('property="og:image"');
    this.meta.removeTag('name="twitter:image"');
  }
}

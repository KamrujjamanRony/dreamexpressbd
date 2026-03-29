import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { environment } from '../../environments/environment';

export interface SeoData {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SSeo {
  private meta = inject(Meta);
  private titleService = inject(Title);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private doc = inject(DOCUMENT);

  private readonly defaults = {
    siteName: environment.companyName,
    description: environment.siteDescription,
    keywords: environment.keywords.join(', '),
    ogImage: `${environment.webUrl}/logo.webp`,
    webUrl: environment.webUrl,
  };

  init() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.activatedRoute),
      map(route => {
        while (route.firstChild) route = route.firstChild;
        return route;
      }),
      mergeMap(route => route.data),
    ).subscribe(data => {
      const seo: SeoData = data['seo'] ?? {};
      this.updateTags(seo);
    });
  }

  updateTags(seo: SeoData) {
    const title = seo.title
      ? `${seo.title} | ${this.defaults.siteName}`
      : this.titleService.getTitle();
    const description = seo.description ?? this.defaults.description;
    const keywords = seo.keywords ?? this.defaults.keywords;
    const ogImage = seo.ogImage ?? this.defaults.ogImage;
    const ogType = seo.ogType ?? 'website';
    const url = `${this.defaults.webUrl}${this.router.url}`;

    this.titleService.setTitle(title);

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: keywords });

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: ogImage });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: ogType });
    this.meta.updateTag({ property: 'og:site_name', content: this.defaults.siteName });

    // Twitter Card
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: ogImage });

    // Robots
    if (seo.noIndex) {
      this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    } else {
      this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    }

    // Canonical URL
    this.updateCanonical(url);
  }

  /** Update for dynamic product pages */
  updateProductMeta(product: { name: string; description?: string; image?: string; price?: number }) {
    const title = `${product.name} | ${this.defaults.siteName}`;
    const description = product.description
      ? product.description.replace(/<[^>]*>/g, '').substring(0, 160)
      : `Buy ${product.name} from ${this.defaults.siteName}`;
    const ogImage = product.image ?? this.defaults.ogImage;

    this.titleService.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: ogImage });
    this.meta.updateTag({ property: 'og:type', content: 'product' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: ogImage });

    // Product structured data
    if (product.price != null) {
      this.addProductJsonLd(product.name, description, ogImage, product.price);
    }
  }

  private updateCanonical(url: string) {
    let link = this.doc.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private addProductJsonLd(name: string, description: string, image: string, price: number) {
    this.removeJsonLd();
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      description,
      image,
      offers: {
        '@type': 'Offer',
        price: price.toString(),
        priceCurrency: 'BDT',
        availability: 'https://schema.org/InStock',
      },
    };
    const script = this.doc.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    script.id = 'seo-jsonld';
    this.doc.head.appendChild(script);
  }

  private removeJsonLd() {
    const existing = this.doc.getElementById('seo-jsonld');
    existing?.remove();
  }
}

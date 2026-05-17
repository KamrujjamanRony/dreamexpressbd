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
        ogImage: `${environment.webUrl}/logo-full.webp`,
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
        const url = `${this.defaults.webUrl}${this.router.url.split('?')[0]}`;

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
            this.meta.updateTag({ name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' });
        }

        // Canonical URL
        this.updateCanonical(url);

        // Remove any previous dynamic JSON-LD (product/blog)
        this.removeJsonLd();
    }

    /** Update for dynamic product pages */
    updateProductMeta(product: { name: string; description?: string; image?: string; price?: number; offerPrice?: number; sku?: string; brand?: string; category?: string }) {
        const title = `${product.name} | Buy Online | ${this.defaults.siteName}`;
        const rawDesc = product.description
            ? product.description.replace(/<[^>]*>/g, '').substring(0, 160)
            : `Buy ${product.name} from ${this.defaults.siteName}. Best price in Bangladesh with fast delivery.`;
        const ogImage = product.image ?? this.defaults.ogImage;
        const url = `${this.defaults.webUrl}${this.router.url.split('?')[0]}`;

        this.titleService.setTitle(title);
        this.meta.updateTag({ name: 'description', content: rawDesc });
        this.meta.updateTag({ name: 'keywords', content: `${product.name}, ${product.brand ?? ''}, ${product.category ?? ''}, ${this.defaults.keywords}` });
        this.meta.updateTag({ property: 'og:title', content: title });
        this.meta.updateTag({ property: 'og:description', content: rawDesc });
        this.meta.updateTag({ property: 'og:image', content: ogImage });
        this.meta.updateTag({ property: 'og:url', content: url });
        this.meta.updateTag({ property: 'og:type', content: 'product' });
        this.meta.updateTag({ name: 'twitter:title', content: title });
        this.meta.updateTag({ name: 'twitter:description', content: rawDesc });
        this.meta.updateTag({ name: 'twitter:image', content: ogImage });
        this.meta.updateTag({ name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' });
        this.updateCanonical(url);

        // Product structured data
        this.addProductJsonLd({
            name: product.name,
            description: rawDesc,
            image: ogImage,
            price: product.offerPrice ?? product.price ?? 0,
            regularPrice: product.price,
            sku: product.sku,
            brand: product.brand,
            url,
        });
    }

    /** Update for dynamic blog/article pages */
    updateBlogMeta(blog: { heading: string; description?: string; image?: string; datePublished?: string }) {
        const title = `${blog.heading} | ${this.defaults.siteName}`;
        const rawDesc = blog.description
            ? blog.description.replace(/<[^>]*>/g, '').substring(0, 160)
            : `Read about ${blog.heading} on ${this.defaults.siteName}`;
        const ogImage = blog.image ?? this.defaults.ogImage;
        const url = `${this.defaults.webUrl}${this.router.url.split('?')[0]}`;

        this.titleService.setTitle(title);
        this.meta.updateTag({ name: 'description', content: rawDesc });
        this.meta.updateTag({ property: 'og:title', content: title });
        this.meta.updateTag({ property: 'og:description', content: rawDesc });
        this.meta.updateTag({ property: 'og:image', content: ogImage });
        this.meta.updateTag({ property: 'og:url', content: url });
        this.meta.updateTag({ property: 'og:type', content: 'article' });
        this.meta.updateTag({ name: 'twitter:title', content: title });
        this.meta.updateTag({ name: 'twitter:description', content: rawDesc });
        this.meta.updateTag({ name: 'twitter:image', content: ogImage });
        this.meta.updateTag({ name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' });
        this.updateCanonical(url);

        this.addArticleJsonLd(title, rawDesc, ogImage, url, blog.datePublished);
    }

    /** Generate BreadcrumbList JSON-LD from breadcrumb trail */
    updateBreadcrumbJsonLd(crumbs: { name: string; url: string }[]) {
        const existing = this.doc.getElementById('seo-breadcrumb');
        existing?.remove();

        if (!crumbs.length) return;

        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: crumbs.map((crumb, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: crumb.name,
                item: crumb.url,
            })),
        };
        const script = this.doc.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(jsonLd);
        script.id = 'seo-breadcrumb';
        this.doc.head.appendChild(script);
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

    private addProductJsonLd(product: { name: string; description: string; image: string; price: number; regularPrice?: number; sku?: string; brand?: string; url: string }) {
        this.removeJsonLd();
        const jsonLd: Record<string, unknown> = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description,
            image: product.image,
            url: product.url,
            offers: {
                '@type': 'Offer',
                price: product.price.toString(),
                priceCurrency: 'BDT',
                availability: 'https://schema.org/InStock',
                seller: {
                    '@type': 'Organization',
                    name: this.defaults.siteName,
                },
            },
        };
        if (product.sku) jsonLd['sku'] = product.sku;
        if (product.brand) jsonLd['brand'] = { '@type': 'Brand', name: product.brand };

        const script = this.doc.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(jsonLd);
        script.id = 'seo-jsonld';
        this.doc.head.appendChild(script);
    }

    private addArticleJsonLd(title: string, description: string, image: string, url: string, datePublished?: string) {
        this.removeJsonLd();
        const jsonLd: Record<string, unknown> = {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: title,
            description,
            image,
            url,
            author: {
                '@type': 'Organization',
                name: this.defaults.siteName,
            },
            publisher: {
                '@type': 'Organization',
                name: this.defaults.siteName,
                logo: {
                    '@type': 'ImageObject',
                    url: this.defaults.ogImage,
                },
            },
        };
        if (datePublished) jsonLd['datePublished'] = datePublished;

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

import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    computed,
    effect,
    inject,
    signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BlogM } from '../../../models/Blog';
import { SBlog } from '../../../services/s-blog';
import { SGallery } from '../../../services/s-gallery';
import { SSeo } from '../../../services/s-seo';
import { BreadcrumbService } from '../../../utils/breadcrumb/breadcrumb.service';

@Component({
    selector: 'app-blog-view',
    imports: [RouterLink],
    templateUrl: './blog-view.html',
    styleUrl: './blog-view.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogView {
    private readonly route = inject(ActivatedRoute);
    private readonly blogService = inject(SBlog);
    private readonly galleryService = inject(SGallery);
    private readonly breadcrumbService = inject(BreadcrumbService);
    private readonly seo = inject(SSeo);
    private readonly sanitizer = inject(DomSanitizer);
    private readonly el = inject(ElementRef<HTMLElement>);
    private observer?: IntersectionObserver;

    protected readonly imgBase = environment.ImageApi;
    protected readonly blog = signal<BlogM | null>(null);
    protected readonly galleryMap = signal<Map<string, string>>(new Map());
    protected readonly loading = signal(true);
    protected readonly notFound = signal(false);
    protected readonly ready = signal(false);

    protected readonly heroImageUrl = computed(() => {
        const blog = this.blog();
        return blog?.imageUrl ? this.galleryMap().get(blog.imageUrl) || '' : '';
    });

    protected readonly embeddedVideo = computed(() => this.toSafeEmbedUrl(this.blog()?.vLink || ''));

    constructor() {
        effect(() => {
            if (this.loading()) {
                return;
            }

            queueMicrotask(() => this.observeReveals());
        });
    }

    ngOnInit() {
        this.route.paramMap.subscribe((params) => {
            const id = params.get('id');
            if (!id) {
                this.loading.set(false);
                this.notFound.set(true);
                return;
            }

            this.loading.set(true);
            this.notFound.set(false);

            forkJoin({
                blog: this.blogService.search(id),
                gallery: this.galleryService.search('', 'Blog'),
            }).subscribe({
                next: ({ blog, gallery }) => {
                    this.galleryMap.set(new Map(gallery.map((item) => [item.id || '', item.imageUrl || ''])));
                    this.blog.set(blog[0] || null);
                    if (blog[0]?.heading) {
                        this.breadcrumbService.appendCrumb(blog[0].heading);
                        const heroImg = blog[0].imageUrl ? this.galleryMap().get(blog[0].imageUrl) || '' : '';
                        this.seo.updateBlogMeta({
                            heading: blog[0].heading,
                            description: blog[0].dtls?.[0]?.desc,
                            image: heroImg || undefined,
                        });
                    }
                    this.loading.set(false);
                    setTimeout(() => this.ready.set(true), 80);
                },
                error: () => {
                    this.blog.set(null);
                    this.loading.set(false);
                    this.notFound.set(true);
                },
            });
        });
    }

    ngAfterViewInit() {
        this.setupObserver();
        this.observeReveals();
    }

    ngOnDestroy() {
        this.observer?.disconnect();
    }

    protected imageFor(id: string): string {
        return id ? this.galleryMap().get(id) || '' : '';
    }

    protected sectionId(index: number): string {
        return `section-${index + 1}`;
    }

    private toSafeEmbedUrl(link: string): SafeResourceUrl | null {
        const videoId = this.extractYouTubeId(link);
        if (!videoId) {
            return null;
        }

        return this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://www.youtube.com/embed/${videoId}`
        );
    }

    private extractYouTubeId(link: string): string | null {
        const input = (link || '').trim();
        if (!input) {
            return null;
        }

        // Support plain YouTube video IDs pasted directly.
        if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
            return input;
        }

        const normalized = /^https?:\/\//i.test(input) ? input : `https://${input}`;

        try {
            const url = new URL(normalized);
            const host = url.hostname.toLowerCase();

            if (host.includes('youtu.be')) {
                const id = url.pathname.split('/').filter(Boolean)[0] || '';
                return id || null;
            }

            if (url.pathname.includes('/embed/')) {
                const id = url.pathname.split('/embed/')[1]?.split('/')[0] || '';
                return id || null;
            }

            if (url.pathname.includes('/shorts/')) {
                const id = url.pathname.split('/shorts/')[1]?.split('/')[0] || '';
                return id || null;
            }

            if (url.pathname.includes('/live/')) {
                const id = url.pathname.split('/live/')[1]?.split('/')[0] || '';
                return id || null;
            }

            return url.searchParams.get('v');
        } catch {
            // Last fallback: extract from common path patterns when URL parsing fails.
            const match = input.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/);
            return match?.[1] || null;
        }
    }

    private setupObserver() {
        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in-view');
                    }
                });
            },
            { threshold: 0.14 }
        );
    }

    private observeReveals() {
        this.el.nativeElement.querySelectorAll('.reveal:not(.in-view)').forEach((element: Element) => {
            this.observer?.observe(element);
        });
    }

}
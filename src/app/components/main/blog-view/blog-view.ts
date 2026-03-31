import { CommonModule } from '@angular/common';
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
import { BreadcrumbService } from '../../../utils/breadcrumb/breadcrumb.service';

@Component({
    selector: 'app-blog-view',
    imports: [CommonModule, RouterLink],
    templateUrl: './blog-view.html',
    styleUrl: './blog-view.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogView {
    private readonly route = inject(ActivatedRoute);
    private readonly blogService = inject(SBlog);
    private readonly galleryService = inject(SGallery);
    private readonly breadcrumbService = inject(BreadcrumbService);
    private readonly sanitizer = inject(DomSanitizer);
    private readonly el = inject(ElementRef<HTMLElement>);
    private observer?: IntersectionObserver;

    protected readonly imgBase = environment.ImageApi;
    protected readonly blog = signal<BlogM | null>(null);
    protected readonly relatedBlogs = signal<BlogM[]>([]);
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
                blog: this.blogService.get(id),
                allBlogs: this.blogService.search(),
                gallery: this.galleryService.search('', 'Blog'),
            }).subscribe({
                next: ({ blog, allBlogs, gallery }) => {
                    this.galleryMap.set(new Map(gallery.map((item) => [item.id || '', item.imageUrl || ''])));
                    this.blog.set(blog);
                    this.relatedBlogs.set(
                        allBlogs
                            .filter((item) => item.id !== blog.id)
                            .sort((left, right) => this.toOrder(left.sl) - this.toOrder(right.sl))
                            .slice(0, 3)
                    );
                    if (blog.heading) {
                        this.breadcrumbService.appendCrumb(blog.heading);
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

    protected sectionLabel(index: number): string {
        return String(index + 1).padStart(2, '0');
    }

    protected readingTime(blog: BlogM | null): string {
        if (!blog) {
            return '1 min read';
        }

        const source = [blog.heading, ...blog.dtls.flatMap((detail) => [detail.title, detail.desc])]
            .join(' ')
            .trim();
        const minutes = Math.max(1, Math.round(source.split(/\s+/).filter(Boolean).length / 160));
        return `${minutes} min read`;
    }

    protected excerpt(blog: BlogM | null, limit: number): string {
        const raw = blog?.dtls?.[0]?.desc || blog?.heading || '';
        const normalized = raw.replace(/\s+/g, ' ').trim();
        if (normalized.length <= limit) {
            return normalized;
        }

        return `${normalized.slice(0, limit).trimEnd()}...`;
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
        if (!link) {
            return null;
        }

        try {
            const url = new URL(link);
            if (url.hostname.includes('youtu.be')) {
                return url.pathname.replace('/', '') || null;
            }
            if (url.pathname.includes('/embed/')) {
                return url.pathname.split('/embed/')[1] || null;
            }
            return url.searchParams.get('v');
        } catch {
            return null;
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

    private toOrder(value: string): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
    }
}
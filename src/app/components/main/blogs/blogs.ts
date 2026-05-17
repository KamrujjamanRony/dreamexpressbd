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
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BlogM } from '../../../models/Blog';
import { SBlog } from '../../../services/s-blog';
import { SGallery } from '../../../services/s-gallery';

type BlogCard = BlogM & {
    heroImageUrl: string;
    primaryTitle: string;
    primaryDesc: string;
};

@Component({
    selector: 'app-blogs',
    imports: [CommonModule, RouterLink],
    templateUrl: './blogs.html',
    styleUrl: './blogs.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Blogs {
    private readonly blogService = inject(SBlog);
    private readonly galleryService = inject(SGallery);
    private readonly el = inject(ElementRef<HTMLElement>);
    private observer?: IntersectionObserver;

    protected readonly companyName = environment.companyName;
    protected readonly imgBase = environment.ImageApi;

    protected readonly blogs = signal<BlogM[]>([]);
    protected readonly galleryMap = signal<Map<string, string>>(new Map());
    protected readonly loading = signal(true);
    protected readonly ready = signal(false);
    protected readonly searchQuery = signal('');

    protected readonly decoratedBlogs = computed<BlogCard[]>(() => {
        const galleryMap = this.galleryMap();

        return [...this.blogs()]
            .sort((left, right) => this.toOrder(left.sl) - this.toOrder(right.sl))
            .map((blog) => ({
                ...blog,
                heroImageUrl: blog.imageUrl ? galleryMap.get(blog.imageUrl) || '' : '',
                primaryTitle: blog.dtls?.[0]?.title?.trim() || 'Inside this story',
                primaryDesc: blog.dtls?.[0]?.desc?.trim() || blog.heading,
            }));
    });

    protected readonly filteredBlogs = computed(() => {
        const query = this.searchQuery().trim().toLowerCase();
        const blogs = this.decoratedBlogs();

        if (!query) {
            return blogs;
        }

        return blogs.filter((blog) =>
            [
                blog.heading,
                blog.sl,
                ...blog.dtls.flatMap((detail) => [detail.title, detail.desc]),
            ]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(query))
        );
    });

    protected readonly featuredBlog = computed(() => this.filteredBlogs()[0] ?? null);
    protected readonly secondaryBlogs = computed(() => this.filteredBlogs().slice(1));
    protected readonly totalSections = computed(() =>
        this.decoratedBlogs().reduce((count, blog) => count + (blog.dtls?.length || 0), 0)
    );
    protected readonly videoBlogCount = computed(() =>
        this.decoratedBlogs().filter((blog) => !!blog.vLink).length
    );

    constructor() {
        effect(() => {
            if (this.loading()) {
                return;
            }

            queueMicrotask(() => this.observeReveals());
        });
    }

    ngOnInit() {
        forkJoin({
            blogs: this.blogService.search(),
            gallery: this.galleryService.search('', 'Blog'),
        }).subscribe({
            next: ({ blogs, gallery }) => {
                this.blogs.set(blogs);
                this.galleryMap.set(new Map(gallery.map((item) => [item.id || '', item.imageUrl || ''])));
                this.loading.set(false);
                setTimeout(() => this.ready.set(true), 80);
            },
            error: () => {
                this.loading.set(false);
                setTimeout(() => this.ready.set(true), 80);
            },
        });
    }

    ngAfterViewInit() {
        this.setupObserver();
        this.observeReveals();
    }

    ngOnDestroy() {
        this.observer?.disconnect();
    }

    protected updateSearch(event: Event) {
        this.searchQuery.set((event.target as HTMLInputElement).value);
    }

    protected excerpt(text: string, limit: number): string {
        const normalized = text.replace(/\s+/g, ' ').trim();
        if (normalized.length <= limit) {
            return normalized;
        }

        return `${normalized.slice(0, limit).trimEnd()}...`;
    }

    protected detailImage(blog: BlogM): string {
        const imageId = blog.dtls.find((detail) => detail.iUrl)?.iUrl;
        return imageId ? this.galleryMap().get(imageId) || '' : '';
    }

    protected readingTime(blog: BlogM): string {
        const source = [blog.heading, ...blog.dtls.flatMap((detail) => [detail.title, detail.desc])]
            .join(' ')
            .trim();
        const minutes = Math.max(1, Math.round(source.split(/\s+/).filter(Boolean).length / 160));
        return `${minutes} min read`;
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
import { Component, inject, signal, DestroyRef, ElementRef, ViewChild, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { SProduct } from '../../../services/s-product';
import { SCategory } from '../../../services/s-category';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-search-overlay',
    imports: [NgOptimizedImage, DecimalPipe],
    templateUrl: './search-overlay.html',
    styleUrl: './search-overlay.css',
})
export class SearchOverlay implements OnInit {
    private productService = inject(SProduct);
    private categoryService = inject(SCategory);
    private router = inject(Router);
    private renderer = inject(Renderer2);
    private destroyRef = inject(DestroyRef);

    @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

    isOpen = signal(false);
    searchValue = signal('');
    searchResults = signal<any[]>([]);
    categories = signal<any[]>([]);
    isLoading = signal(false);
    recentSearches = signal<string[]>([]);
    isClosing = signal(false);

    imageBaseUrl = environment.ImageApi;
    private searchSubject = new Subject<string>();

    private readonly RECENT_KEY = 'recent_searches';
    private readonly MAX_RECENT = 6;

    ngOnInit() {
        this.loadRecentSearches();

        this.categoryService.search().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
            this.categories.set(data.slice(0, 8));
        });

        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(term => {
                if (!term || term.length < 2) {
                    this.isLoading.set(false);
                    return of([]);
                }
                this.isLoading.set(true);
                return this.productService.search(0, 0, term, null);
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(results => {
            this.searchResults.set(results);
            this.isLoading.set(false);
        });
    }

    open() {
        this.isOpen.set(true);
        this.isClosing.set(false);
        this.renderer.addClass(document.body, 'overflow-hidden');
        setTimeout(() => this.searchInputRef?.nativeElement?.focus(), 100);
    }

    close() {
        this.isClosing.set(true);
        setTimeout(() => {
            this.isOpen.set(false);
            this.isClosing.set(false);
            this.searchValue.set('');
            this.searchResults.set([]);
            this.renderer.removeClass(document.body, 'overflow-hidden');
        }, 250);
    }

    onInput(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.searchValue.set(value);
        this.searchSubject.next(value);
    }

    clearSearch() {
        this.searchValue.set('');
        this.searchResults.set([]);
        this.searchInputRef?.nativeElement?.focus();
    }

    navigateToProduct(productId: number) {
        this.saveRecentSearch(this.searchValue());
        this.close();
        this.router.navigate(['/view', productId]);
    }

    performSearch() {
        const term = this.searchValue();
        if (term && term.length >= 2) {
            this.saveRecentSearch(term);
            this.close();
            this.router.navigate(['/shop'], { queryParams: { search: term } });
        }
    }

    searchByRecent(term: string) {
        this.searchValue.set(term);
        this.searchSubject.next(term);
        this.searchInputRef?.nativeElement?.focus();
    }

    removeRecent(term: string, event: Event) {
        event.stopPropagation();
        const updated = this.recentSearches().filter(s => s !== term);
        this.recentSearches.set(updated);
        try { localStorage.setItem(this.RECENT_KEY, JSON.stringify(updated)); } catch { }
    }

    clearAllRecent() {
        this.recentSearches.set([]);
        try { localStorage.removeItem(this.RECENT_KEY); } catch { }
    }

    navigateToCategory(categoryId: number) {
        this.close();
        this.router.navigate(['/shop'], { queryParams: { category: categoryId } });
    }

    private saveRecentSearch(term: string) {
        if (!term || term.length < 2) return;
        let recent = this.recentSearches().filter(s => s !== term);
        recent.unshift(term);
        recent = recent.slice(0, this.MAX_RECENT);
        this.recentSearches.set(recent);
        try { localStorage.setItem(this.RECENT_KEY, JSON.stringify(recent)); } catch { }
    }

    private loadRecentSearches() {
        try {
            const stored = localStorage.getItem(this.RECENT_KEY);
            if (stored) this.recentSearches.set(JSON.parse(stored));
        } catch { }
    }
}

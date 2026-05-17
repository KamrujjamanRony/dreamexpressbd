import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { SCategory } from '../../../services/s-category';
import { SProduct } from '../../../services/s-product';
import { Carousel } from "./carousel/carousel";
import { Categories } from "./categories/categories";
import { ProductSkeleton } from "../../shared/product-skeleton/product-skeleton";
import { ProductWrapper } from "./product-wrapper/product-wrapper";
import { ProductM } from '../../../models/Products';
import { SCarousel } from '../../../services/s-carousel';

@Component({
  selector: 'app-home',
  imports: [Carousel, Categories, ProductSkeleton, ProductWrapper],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private categoryService = inject(SCategory);
  private productService = inject(SProduct);
  private carouselService = inject(SCarousel);

  loading = signal(true);
  loadFailed = signal(false);
  carouselReady = signal(false);
  products = signal<ProductM[]>([]);
  categories = signal<any[]>([]);
  carousels = signal<any[]>([]);
  productWithDiscount = computed(() => {
    const products = this.products();
    if (!products) return [];
    const productsWithDiscount = products.map((product: any) => {
      const offerPrice = product.offerPrice;
      const regularPrice = product.regularPrice;
      let discount = 0;

      if (offerPrice > 0 && regularPrice > 0) {
        discount = Math.round(((regularPrice - offerPrice) / regularPrice) * 100);
      }

      return {
        ...product,
        discount: discount
      };
    });
    return productsWithDiscount;
  });
  categoryWiseProducts = computed(() => {
    const categoryMap: { [key: string]: ProductM[] } = {};
    for (const product of this.productWithDiscount()) {
      const categoryName = product.categoryName;
      if (!categoryMap[categoryName]) {
        categoryMap[categoryName] = [];
      }
      categoryMap[categoryName].push(product);
    }
    return categoryMap;
  });

  ngOnInit() {
    if (this.products().length === 0) {
      this.loadData();
    }
  }

  retryLoad() {
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);
    this.loadFailed.set(false);

    // Phase 1: Load carousel + permissions ASAP for fastest LCP
    forkJoin({
      carousels: this.carouselService.search(),
    }).subscribe({
      next: ({ carousels }) => {
        this.carousels.set(carousels);
        this.carouselReady.set(true);
      },
    });

    // Phase 2: Load content data in parallel (doesn't block carousel)
    forkJoin({
      products: this.productService.search(0, 0, '', 1).pipe(catchError(() => of([]))),
      categories: this.categoryService.search().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ products, categories }) => {
        this.products.set(products);
        this.categories.set(categories);
        this.loadFailed.set(products.length === 0 && categories.length === 0);
        this.loading.set(false);
      },
      error: () => {
        this.loadFailed.set(true);
        this.loading.set(false);
      },
    });
  }

}

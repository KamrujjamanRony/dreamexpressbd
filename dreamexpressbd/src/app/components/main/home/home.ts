import { Component, computed, inject, signal } from '@angular/core';
import { SData } from '../../../services/s-data';
import { SCategory } from '../../../services/s-category';
import { SProduct } from '../../../services/s-product';
import { Carousel } from "./carousel/carousel";
import { FeatureProduct } from "./feature-product/feature-product";
import { Categories } from "./categories/categories";
import { ProductSkeleton } from "../../shared/product-skeleton/product-skeleton";
import { ProductWrapper } from "./product-wrapper/product-wrapper";
import { AddSection } from "./add-section/add-section";
import { RecommendProduct } from "./recommend-product/recommend-product";
import { ProductM } from '../../../models/Products';

@Component({
  selector: 'app-home',
  imports: [Carousel, FeatureProduct, Categories, ProductSkeleton, ProductWrapper, AddSection, RecommendProduct],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private dataService = inject(SData);
  private categoryService = inject(SCategory);
  private productService = inject(SProduct);

  loading = signal(true);
  products = signal<ProductM[]>([]);
  categories = signal<any[]>([]);
  
  // Create computed signals for permissions
  isBannerPermitted = computed(() => this.dataService.isPermitted("Banner"));
  isFeaturedPermitted = computed(() => this.dataService.isPermitted("Featured Product"));
  isCategoriesPermitted = computed(() => this.dataService.isPermitted("Categories"));
  isProductsPermitted = computed(() => this.dataService.isPermitted("Products"));
  isAddSectionPermitted = computed(() => this.dataService.isPermitted("Add Section"));
  isRecommendPermitted = computed(() => this.dataService.isPermitted("Recommend Section"));
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
      if (!categoryMap[product.category]) {
        categoryMap[product.category] = [];
      }
      categoryMap[product.category].push(product);
    }
    return categoryMap;
  });

  ngOnInit() {
    if (this.products().length === 0) {
      this.loadData();
    }
  }

  private loadData() {
    this.loading.set(true);

    this.productService.search().subscribe({
      next: (data) => {
        this.products.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // Load sections first
    this.dataService.loadSections().subscribe({
      next: () => {
        // Now permissions will be updated
        if (this.dataService.isPermitted("Categories") && this.categories().length === 0) {
          this.categoryService.search().subscribe({
            next: (data) => {
              this.categories.set(data);
            },
            error: (err) => console.error('Category load failed:', err),
          });
        }
      }
    });
  }

}

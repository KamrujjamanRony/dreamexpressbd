import { Component, computed, inject, signal } from '@angular/core';
import { SData } from '../../../services/s-data';
import { SCategory } from '../../../services/s-category';
import { SProduct } from '../../../services/s-product';
import { Product } from '../../../models/Products';
import { Carousel } from "./carousel/carousel";
import { FeatureProduct } from "./feature-product/feature-product";
import { Categories } from "./categories/categories";
import { ProductSkeleton } from "../../shared/product-skeleton/product-skeleton";
import { ProductWrapper } from "./product-wrapper/product-wrapper";
import { AddSection } from "./add-section/add-section";
import { RecommendProduct } from "./recommend-product/recommend-product";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [Carousel, FeatureProduct, Categories, ProductSkeleton, ProductWrapper, AddSection, RecommendProduct, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private dataService = inject(SData);
  private categoryService = inject(SCategory);
  private productService = inject(SProduct);

  loading = signal(true);
  products = signal<Product[]>([]);
  categories = signal<any[]>([]);
  
  // Create computed signals for permissions
  isBannerPermitted = computed(() => this.dataService.isPermitted("Banner"));
  isFeaturedPermitted = computed(() => this.dataService.isPermitted("Featured Product"));
  isCategoriesPermitted = computed(() => this.dataService.isPermitted("Categories"));
  isProductsPermitted = computed(() => this.dataService.isPermitted("Products"));
  isAddSectionPermitted = computed(() => this.dataService.isPermitted("Add Section"));
  isRecommendPermitted = computed(() => this.dataService.isPermitted("Recommend Section"));

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

import { Component, inject, Renderer2, signal, computed, effect } from '@angular/core';
import { ProductSkeleton } from '../../shared/product-skeleton/product-skeleton';
import { ProductCard } from '../../shared/product-card/product-card';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SProduct } from '../../../services/s-product';
import { SData } from '../../../services/s-data';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-shop',
  imports: [ProductSkeleton, ProductCard, CommonModule, FormsModule],
  templateUrl: './shop.html',
  styleUrl: './shop.css',
})
export class Shop {
  private productService = inject(SProduct);
  private dataService = inject(SData);
  private route = inject(ActivatedRoute);
  private renderer = inject(Renderer2);

  // Signals for reactive state
  products = signal<any>(null);
  categories = signal<any[]>([]);
  brands = signal<any[]>([]);
  sizes = signal<any[]>([]);
  colors = signal<any[]>([]);

  // Filter signals
  categoryNames = signal<string[]>([]);
  brandNames = signal<string[]>([]);
  sizeName = signal<string>("");
  colorName = signal<string>("");
  discountValues = signal<string[]>([]);
  sortValue = signal<string>("");

  // Price range signals
  minRangeValue = signal<number>(0);
  maxRangeValue = signal<number>(1000);
  priceMin = signal<number>(0);
  priceMax = signal<number>(1000);

  // Search filter signals
  categorySearch = signal<string>('');
  brandSearch = signal<string>('');
  colorSearch = signal<string>('');

  // Drawer state
  isDrawerOpen = signal<boolean>(false);

  // Computed filtered values
  filteredCategories = computed(() => {
    const categories = this.categories();
    const search = this.categorySearch().toLowerCase();

    if (!categories.length) return [];
    if (!search) return categories;

    return categories.filter((cat: any) =>
      cat.title.toLowerCase().includes(search)
    );
  });

  filteredBrands = computed(() => {
    const brands = this.brands();
    const search = this.brandSearch().toLowerCase();

    if (!brands.length) return [];
    if (!search) return brands;

    return brands.filter((brand: any) =>
      brand.title.toLowerCase().includes(search)
    );
  });

  filteredColors = computed(() => {
    const colors = this.colors();
    const search = this.colorSearch().toLowerCase();

    if (!colors.length) return [];
    if (!search) return colors;

    return colors.filter((color: any) =>
      color.title.toLowerCase().includes(search)
    );
  });

  // Active track width for price slider
  activeTrackWidth = computed(() => {
    const total = this.priceMax() - this.priceMin();
    const min = this.minRangeValue() - this.priceMin();
    const max = this.maxRangeValue() - this.priceMin();
    const leftPercent = (min / total) * 100;
    const widthPercent = ((max - min) / total) * 100;
    return `${widthPercent}%`;
  });

  activeTrackLeft = computed(() => {
    const total = this.priceMax() - this.priceMin();
    const min = this.minRangeValue() - this.priceMin();
    const leftPercent = (min / total) * 100;
    return `${leftPercent}%`;
  });

  // Filtered products computed

  filteredProducts = computed(() => {
    const products = this.products();
    if (!products) return null;
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

    return this.byDiscount(
      this.byPrice(
        this.byCategory(
          this.byBrand(
            this.bySize(
              this.byColor(
                this.bySorting(productsWithDiscount)
              )
            )
          )
        )
      )
    );
  });

  constructor() {
    // Effect to handle body overflow when drawer opens/closes
    effect(() => {
  if (this.isDrawerOpen() && window.innerWidth < 768) {
    this.renderer.addClass(document.body, 'overflow-hidden');
  } else {
    this.renderer.removeClass(document.body, 'overflow-hidden');
  }
});
  }

  ngOnInit() {
    this.dataService.loadSections().subscribe();

    // Handle route params and query params
    this.route.paramMap.subscribe(() => {
      this.loadProducts();
    });

    this.route.queryParamMap.subscribe(queryParams => {
      const category = queryParams.get('category');
      if (category) {
        this.categoryNames.set([category]);
      } else {
        this.categoryNames.set([]);
      }
      this.loadProducts();
    });
  }

  loadProducts() {
    const queryParams = this.route.snapshot.queryParams;
    const category = queryParams['category'] || '';

    this.productService.search('', category).subscribe(data => {
      this.products.set(data);
      this.categories.set(this.groupProductsByProperty(data, 'category'));
      this.brands.set(this.groupProductsByProperty(data, 'brand'));
      this.sizes.set(this.groupProductsByArrayProperty(data, 'sizes'));
      this.colors.set(this.groupProductsByArrayProperty(data, 'colors'));

      // Set price range based on products
      if (data && data.length > 0) {
        const prices = data.map((p: any) => p.offerPrice || p.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        this.priceMin.set(min);
        this.priceMax.set(max);
        this.minRangeValue.set(min);
        this.maxRangeValue.set(max);
      }
    });
  }

  groupProductsByProperty(products: any[], property: string): any[] {
    const propertyMap = products.reduce((acc, product) => {
      const prop = product[property];
      if (!acc[prop]) {
        acc[prop] = 0;
      }
      acc[prop]++;
      return acc;
    }, {});
    return Object.keys(propertyMap).map(prop => ({
      title: prop,
      quantity: propertyMap[prop]
    }));
  }

  groupProductsByArrayProperty(products: any[], property: string): any[] {
    const propertyMap = products.reduce((acc, product) => {
      const props = product[property];
      if (Array.isArray(props)) {
        props.forEach(prop => {
          if (!acc[prop]) {
            acc[prop] = 0;
          }
          acc[prop]++;
        });
      }
      return acc;
    }, {});
    return Object.keys(propertyMap).map(prop => ({
      title: prop,
      quantity: propertyMap[prop]
    }));
  }

  toggleCategoryName(category: string, event: any): void {
    const current = this.categoryNames();
    if (event.target.checked) {
      this.categoryNames.set([...current, category]);
    } else {
      this.categoryNames.set(current.filter(c => c !== category));
    }
  }

  toggleBrandName(brand: string, event: any): void {
    const current = this.brandNames();
    if (event.target.checked) {
      this.brandNames.set([...current, brand]);
    } else {
      this.brandNames.set(current.filter(b => b !== brand));
    }
  }

  toggleSizeName(size: string, event: any): void {
    if (event.target.checked) {
      this.sizeName.set(size);
    } else {
      this.sizeName.set("");
    }
  }

  toggleColorName(color: string, event: any): void {
    if (event.target.checked) {
      this.colorName.set(color);
    } else {
      this.colorName.set("");
    }
  }

  toggleDiscount(discount: string, event: any): void {
    if (event.target.checked) {
      this.discountValues.set([discount]);
    } else {
      this.discountValues.set([]);
    }
  }

  byCategory(data: any): any {
    const categories = this.categoryNames();
    if (!categories || categories.length === 0) {
      return data;
    }
    return data.filter((product: any) =>
      product && categories.includes(product.category.toString())
    );
  }

  byBrand(data: any): any {
    const brands = this.brandNames();
    if (!brands || brands.length === 0) {
      return data;
    }
    return data.filter((product: any) =>
      product && brands.includes(product.brand.toString())
    );
  }

  bySize(data: any): any {
    const size = this.sizeName();
    if (size === "") {
      return data;
    }
    return data.filter((product: any) =>
      product?.sizes.includes(size)
    );
  }

  byColor(data: any): any {
    const color = this.colorName();
    if (color === "") {
      return data;
    }
    return data.filter((product: any) =>
      product?.colors.includes(color)
    );
  }

  byPrice(data: any[]): any[] {
    if (this.minRangeValue() === this.priceMin() &&
      this.maxRangeValue() === this.priceMax()) {
      return data;
    }

    return data.filter((product: any) => {
      const price = product.offerPrice || product.price;
      return price >= this.minRangeValue() && price <= this.maxRangeValue();
    });
  }

  byDiscount(data: any[]): any[] {
    const discounts = this.discountValues();
    if (discounts.length === 0) {
      return data;
    }

    const discountValue = parseInt(discounts[0]);
    return data.filter((product: any) => {
      const discount = product.discount || 0;
      return discount >= discountValue;
    });
  }

  bySorting(data: any): any {
    const sort = this.sortValue();
    if (sort === "") {
      return data;
    } else if (sort === "low-high") {
      return [...data].sort((a: any, b: any) =>
        (a.offerPrice || a.price) - (b.offerPrice || b.price)
      );
    } else if (sort === "high-low") {
      return [...data].sort((a: any, b: any) =>
        (b.offerPrice || b.price) - (a.offerPrice || a.price)
      );
    } else if (sort === "latest") {
      return [...data].sort((a: any, b: any) =>
        new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime()
      );
    }
    return data;
  }

  onClearFilter() {
    this.categoryNames.set([]);
    this.brandNames.set([]);
    this.sizeName.set("");
    this.colorName.set("");
    this.discountValues.set([]);
    this.minRangeValue.set(this.priceMin());
    this.maxRangeValue.set(this.priceMax());
    this.categorySearch.set('');
    this.brandSearch.set('');
    this.colorSearch.set('');
  }

  applyFilters() {
    // Filters are already applied via computed, just close drawer on mobile
    if (window.innerWidth < 768) {
      this.closeDrawer();
    }
  }

  // Drawer methods
  openDrawer(): void {
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  onMinRangeChange(event: any) {
    const value = parseInt(event.target.value);
    if (value <= this.maxRangeValue()) {
      this.minRangeValue.set(value);
    }
  }

  onMaxRangeChange(event: any) {
    const value = parseInt(event.target.value);
    if (value >= this.minRangeValue()) {
      this.maxRangeValue.set(value);
    }
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'overflow-hidden');
  }
}
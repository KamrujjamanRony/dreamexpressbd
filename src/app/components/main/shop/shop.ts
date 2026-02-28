import { Component, inject } from '@angular/core';
import { Breadcrumbs } from '../../shared/breadcrumbs/breadcrumbs';
import { ProductSkeleton } from '../../shared/product-skeleton/product-skeleton';
import { ProductCard } from '../../shared/product-card/product-card';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SProduct } from '../../../services/s-product';
import { SData } from '../../../services/s-data';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-shop',
  imports: [Breadcrumbs, ProductSkeleton, ProductCard, CommonModule, FormsModule],
  templateUrl: './shop.html',
  styleUrl: './shop.css',
})
export class Shop {
  productService = inject(SProduct);
  dataService = inject(SData);
  route = inject(ActivatedRoute);

  products: any;
  categories: any;
  brands: any;
  paramName: any = "";
  categoryNames: string[] = [];
  brandNames: string[] = [];
  sizeName: string = "";
  colorName: string = "";
  prices: any;
  sizes: any;
  colors: any;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sortValue: string = "";
  paramsSubscription?: Subscription;
  queryParamsSubscription?: Subscription;

  ngOnInit() {
    this.dataService.loadSections().subscribe();

    // Handle both route params and query params
    this.paramsSubscription = this.route.paramMap.subscribe(params => {
      this.loadProducts();
    });

    this.queryParamsSubscription = this.route.queryParamMap.subscribe(queryParams => {
      const category = queryParams.get('category');
      if (category) {
        this.categoryNames = [category];
      } else {
        this.categoryNames = [];
      }
      this.loadProducts();
    });
  }

  loadProducts() {
    const queryParams = this.route.snapshot.queryParams;
    const category = queryParams['category'] || '';

    this.productService.search('', category).subscribe(data => {
      this.products = data;
      this.categories = this.groupProductsByProperty(this.products, 'category');
      this.brands = this.groupProductsByProperty(this.products, 'brand');
      this.prices = this.groupProductsByProperty(this.products, 'offerPrice');
      this.sizes = this.groupProductsByArrayProperty(this.products, 'sizes');
      this.colors = this.groupProductsByArrayProperty(this.products, 'colors');
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
    if (event.target.checked) {
      this.categoryNames.push(category);
    } else {
      const index = this.categoryNames.indexOf(category);
      if (index > -1) {
        this.categoryNames.splice(index, 1);
      }
    }
  }

  toggleBrandName(brand: string, event: any): void {
    if (event.target.checked) {
      this.brandNames.push(brand);
    } else {
      const index = this.brandNames.indexOf(brand);
      if (index > -1) {
        this.brandNames.splice(index, 1);
      }
    }
  }

  toggleSizeName(size: string): void {
    if (this.sizeName === size) {
      this.sizeName = ""; // Uncheck if double-clicked
    } else {
      this.sizeName = size; // Set the selected size
    }
  }

  toggleColorName(color: string): void {
    if (this.colorName === color) {
      this.colorName = ""; // Uncheck if double-clicked
    } else {
      this.colorName = color; // Set the selected color
    }
  }

  byCategory(data: any): any {
    if (!this.categoryNames || this.categoryNames.length === 0) {
      return data; // If the categoryNames array is empty, return all data
    }
    const selectedData = data.filter((product: any) => product && this.categoryNames.includes(product.category.toString()));
    return selectedData;
  }

  byBrand(data: any): any {
    if (!this.brandNames || this.brandNames.length === 0) {
      return data; // If the brandNames array is empty, return all data
    }
    const selectedData = data.filter((product: any) => product && this.brandNames.includes(product.brand.toString()));
    return selectedData;
  }

  bySize(data: any): any {
    if (this.sizeName == "") {
      return data; // If the sizeNames array is empty, return all data
    }
    const selectedData = data.filter((product: any) => product?.sizes.includes(this.sizeName));
    return selectedData;
  }

  byColor(data: any): any {
    if (this.colorName == "") {
      return data; // If the colorNames array is empty, return all data
    }
    const selectedData = data.filter((product: any) => product?.colors.includes(this.colorName));
    return selectedData;
  }

  byPrice(data: any[]): any[] {
    if (this.minPrice === null && this.maxPrice === null) {
      return data; // If no price range is set, return all data
    }

    return data.filter((product: any) => {
      const price = product.offerPrice || product.price; // Use whichever property holds the price
      const meetsMin = this.minPrice === null || price >= this.minPrice;
      const meetsMax = this.maxPrice === null || price <= this.maxPrice;
      return meetsMin && meetsMax;
    });
  }

  bySorting(data: any): any {
    if (this.sortValue === "") {
      return data; // If the sortValue is empty, return all data
    } else if (this.sortValue === "low-high") {
      return data?.sort((a: any, b: any) => a.offerPrice - b.offerPrice);
    } else if (this.sortValue === "high-low") {
      return data?.sort((a: any, b: any) => b.offerPrice - a.offerPrice);
    } else if (this.sortValue === "latest") {
      return data?.sort((a: any, b: any) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime());
    }
  }

  onClearFilter() {
    this.categoryNames = [];
    this.brandNames = [];
    this.sizeName = "";
    this.colorName = "";
    this.minPrice = null;
    this.maxPrice = null;
  }

  ngOnDestroy() {
    this.paramsSubscription?.unsubscribe();
    this.queryParamsSubscription?.unsubscribe();
  }

}

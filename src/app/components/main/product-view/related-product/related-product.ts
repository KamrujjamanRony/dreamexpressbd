import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, Input } from '@angular/core';
import { ProductCard } from '../../../shared/product-card/product-card';

@Component({
  selector: 'app-related-product',
  imports: [ProductCard],
  templateUrl: './related-product.html',
  styleUrl: './related-product.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class RelatedProduct {
  currentProduct = input<any>(null);
  allProducts = input<any[]>([]);

  // Get related products based on the current product's relatedProducts array
  relatedProduct = computed(() => {
     if (!this.currentProduct()?.relatedProducts || !this.allProducts()?.length) {
      return [];
    }
    return this.allProducts().filter(product =>
      this.currentProduct()?.relatedProducts.includes(product.id) &&
      product.id !== this.currentProduct()?.id
    );
  });

  breakpoints = {
    480: { slidesPerView: 2, spaceBetween: 15 },
    768: { slidesPerView: 3, spaceBetween: 10 },
    1024: { slidesPerView: 3, spaceBetween: 20 },
    1440: { slidesPerView: 4, spaceBetween: 20 }
    // 480: { slidesPerView: 1, spaceBetween: 5 },
    // 768: { slidesPerView: 2, spaceBetween: 10 },
    // 1024: { slidesPerView: 3, spaceBetween: 20 },
    // 1440: { slidesPerView: 4, spaceBetween: 25 }
  }

}

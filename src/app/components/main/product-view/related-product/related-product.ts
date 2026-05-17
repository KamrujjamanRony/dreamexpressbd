import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ProductCard } from '../../../shared/product-card/product-card';

@Component({
  selector: 'app-related-product',
  imports: [ProductCard],
  templateUrl: './related-product.html',
  styleUrl: './related-product.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatedProduct {
  currentProduct = input<any>(null);
  allProducts = input<any[]>([]);

  relatedProduct = computed(() => {
    if (!this.currentProduct()?.relatedProducts || !this.allProducts()?.length) {
      return [];
    }
    return this.allProducts().filter(product =>
      this.currentProduct()?.relatedProducts.includes(product.id) &&
      product.id !== this.currentProduct()?.id
    );
  });
}

import { Component, inject, signal } from '@angular/core';
import { ViewImage } from './view-image/view-image';
import { ViewContent } from './view-content/view-content';
import { Breadcrumbs } from '../../shared/breadcrumbs/breadcrumbs';
import { RelatedProduct } from './related-product/related-product';
import { ActivatedRoute } from '@angular/router';
import { SProduct } from '../../../services/s-product';
import { Subscription } from 'rxjs';
import { ProductSkeleton } from "../../shared/product-skeleton/product-skeleton";

@Component({
  selector: 'app-product-view',
  imports: [Breadcrumbs, ViewContent, ViewImage, RelatedProduct, ProductSkeleton],
  templateUrl: './product-view.html',
  styleUrl: './product-view.css',
})
export class ProductView {

  route = inject(ActivatedRoute);
  productService = inject(SProduct);
  paramsSubscription?: Subscription;
  product = signal<any>(null);
  allProducts = signal<any[]>([]);

  ngOnInit() {
    // Fetch all products to use in related products component
    this.productService.search().subscribe(products => {
      this.allProducts.set(products);
    });
    this.paramsSubscription = this.route.paramMap.subscribe({
      next: (params: any) => {
        const id = params.get('id');
        this.productService.get(id).subscribe(data => {
          this.product.set(data);
        });
      },
    });
  }

}

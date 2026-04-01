import { Component, inject, signal } from '@angular/core';
import { ViewImage } from './view-image/view-image';
import { ViewContent } from './view-content/view-content';
import { RelatedProduct } from './related-product/related-product';
import { ActivatedRoute } from '@angular/router';
import { SProduct } from '../../../services/s-product';
import { BreadcrumbService } from '../../../utils/breadcrumb/breadcrumb.service';
import { Subscription } from 'rxjs';
import { ProductSkeleton } from "../../shared/product-skeleton/product-skeleton";

@Component({
  selector: 'app-product-view',
  imports: [ViewContent, ViewImage, RelatedProduct, ProductSkeleton],
  templateUrl: './product-view.html',
  styleUrl: './product-view.css',
})
export class ProductView {

  route = inject(ActivatedRoute);
  productService = inject(SProduct);
  private breadcrumbService = inject(BreadcrumbService);
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
        this.productService.search().subscribe(data => {
          const selected = data.find((item: any) => String(item?.id) === String(id)) || null;
          this.product.set(selected);
          if (selected?.title) {
            this.breadcrumbService.appendCrumb(selected.title);
          }
        });
      },
    });
  }

}

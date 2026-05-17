import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BdtPipe } from "../../../pipes/bdt.pipe";
import { SCart } from '../../../services/s-cart';
import { SToast } from '../../../utils/toast/toast.service';
import { CartDrawerService } from '../../../utils/cart-drawer/cart-drawer.service';
import { CartProductM } from '../../../models/Cart';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, RouterLink, BdtPipe, NgOptimizedImage],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  product = input<any>(null);
  isPriority = input(false);
  imageBaseUrl = environment.ImageApi;
  private router = inject(Router);
  private cartService = inject(SCart);
  private toast = inject(SToast);
  private cartDrawer = inject(CartDrawerService);

  getStarsArray(averageRating: number): boolean[] {
    const roundedRating = Math.round(averageRating * 2) / 2;
    return Array.from({ length: 5 }, (_, index) => index < roundedRating);
  }

  getViewLink(id: any) {
    return `/view/${id}`;
  }

  addToCart(product: any) {
    const p = product();
    if (!p) return;

    const price = p.offerPrice || p.regularPrice || 0;
    const item: CartProductM = {
      productId: p.id,
      quantity: 1,
      selectSize: '',
      selectColor: '',
      price,
      totalPrice: price,
    };

    this.cartService.addLocalProduct(item);
    this.cartService.refreshCartCount();
    this.toast.success('Added to cart', 'top-left', 1800);
    this.cartDrawer.open();
  }

  buyNow(product: any) {
    const p = product();
    if (!p) return;

    const price = p.offerPrice || p.regularPrice || 0;
    const orderData = {
      subtotal: price,
      products: [{
        productId: p.id,
        productName: p.title || p.name || 'Product',
        quantity: 1,
        selectSize: '',
        selectColor: '',
        price,
        totalPrice: price,
        image: p.resolvedImageUrl || p.image || '',
      }],
    };

    this.router.navigate(['/checkout'], { state: { orderData } });
  }
}

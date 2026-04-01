import { Component, inject, signal } from '@angular/core';
import { SWishlist } from '../../../services/s-wishlist';
import { SProduct } from '../../../services/s-product';
import { SCart } from '../../../services/s-cart';
import { SToast } from '../../../utils/toast/toast.service';
import { Router, RouterLink } from '@angular/router';
import { WishlistM, WishlistProductM } from '../../../models/Wishlist';
import { CartM, CartProductM } from '../../../models/Cart';
import { NgOptimizedImage } from '@angular/common';
import { BdtPipe } from '../../../pipes/bdt.pipe';
import { environment } from '../../../../environments/environment';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faHeart,
  faTrash,
  faShoppingBag,
  faArrowLeft,
  faCartShopping,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-wishlist',
  imports: [NgOptimizedImage, BdtPipe, FontAwesomeModule, RouterLink],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css',
})
export class Wishlist {
  private wishlistService = inject(SWishlist);
  private productService = inject(SProduct);
  private cartService = inject(SCart);
  private toast = inject(SToast);
  private router = inject(Router);

  faHeart = faHeart;
  faTrash = faTrash;
  faShoppingBag = faShoppingBag;
  faArrowLeft = faArrowLeft;
  faCartShopping = faCartShopping;

  imgBaseUrl = environment.ImageApi;

  items = signal<any[]>([]);
  products = signal<any[]>([]);
  loading = signal(true);
  userWishlist = signal<WishlistM | null>(null);

  get isCustomer(): boolean {
    return this.wishlistService.isCustomer();
  }

  ngOnInit() {
    this.loadWishlist();
    this.wishlistService.wishlistUpdated$.subscribe(() => this.loadWishlist());
  }

  loadWishlist() {
    this.loading.set(true);
    this.productService.search().subscribe((productData) => {
      this.products.set(productData);

      if (this.isCustomer) {
        const customerId = this.wishlistService.getCustomerId();
        if (!customerId) { this.loading.set(false); return; }

        this.wishlistService.search(customerId).subscribe({
          next: (wishlistData: WishlistM[]) => {
            if (wishlistData?.length > 0) {
              this.userWishlist.set(wishlistData[0]);
              this.items.set(this.mergeWithProducts(wishlistData[0].products || []));
            } else {
              this.items.set([]);
            }
            this.loading.set(false);
          },
          error: () => {
            this.items.set([]);
            this.loading.set(false);
          },
        });
      } else {
        // Guest: load from localStorage
        const localWishlist = this.wishlistService.getLocalWishlist();
        this.items.set(this.mergeWithProducts(localWishlist));
        this.loading.set(false);
      }
    });
  }

  mergeWithProducts(wishlistItems: WishlistProductM[]) {
    return wishlistItems.map((item) => {
      const product = this.products().find((p) => p.id?.toString() === item.productId?.toString());
      const price = product?.offerPrice || product?.regularPrice || 0;
      return {
        productId: item.productId,
        selectSize: item.selectSize,
        selectColor: item.selectColor,
        productName: product?.title || product?.name || 'Unknown',
        price,
        image: this.resolveProductImage(product),
        category: product?.categoryName || '',
        brand: product?.brand || '',
        inStock: product?.isActive !== false,
      };
    });
  }

  private resolveProductImage(product: any): string {
    const value = product?.resolvedImageUrl || product?.imageUrl || product?.image || '';
    if (!value) return '';
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
      return value;
    }
    return `${this.imgBaseUrl}${value}`;
  }

  removeItem(item: any) {
    if (this.isCustomer) {
      const wishlist = this.userWishlist();
      if (!wishlist) return;
      const updated: WishlistM = {
        ...wishlist,
        products: wishlist.products.filter(
          (p) => !(
            p.productId === item.productId &&
            p.selectSize === item.selectSize &&
            p.selectColor === item.selectColor
          )
        ),
      };
      this.wishlistService.update(wishlist.id!, updated).subscribe({
        next: () => {
          this.userWishlist.set(updated);
          this.items.set(this.mergeWithProducts(updated.products));
          this.toast.success('Removed from wishlist', 'top-right', 2000);
        },
      });
    } else {
      this.wishlistService.removeLocalProduct(item.productId, item.selectSize, item.selectColor);
      const local = this.wishlistService.getLocalWishlist();
      this.items.set(this.mergeWithProducts(local));
      this.toast.success('Removed from wishlist', 'top-right', 2000);
    }
  }

  addToCartAndRemove(item: any) {
    const cartProduct: CartProductM = {
      productId: item.productId,
      selectSize: item.selectSize || '',
      selectColor: item.selectColor || '',
      quantity: 1,
      price: item.price,
      totalPrice: item.price,
    };

    const customerId = this.cartService.getCustomerId();

    if (customerId) {
      this.cartService.search(customerId).subscribe({
        next: (cart) => {
          if (cart.length > 0) {
            const userCart: CartM = { ...cart[0] };
            const existIdx = userCart.products.findIndex(
              (p) =>
                p.productId == cartProduct.productId &&
                p.selectSize === cartProduct.selectSize &&
                p.selectColor === cartProduct.selectColor
            );
            if (existIdx !== -1) {
              userCart.products[existIdx].quantity += 1;
            } else {
              userCart.products.push(cartProduct);
            }
            this.cartService.update(userCart.id!, userCart).subscribe({
              next: () => {
                this.removeItem(item);
                this.toast.success('Moved to cart!', 'top-right', 2000);
              },
            });
          } else {
            const newCart: CartM = {
              companyID: environment.companyCode,
              userId: customerId,
              products: [cartProduct],
              subtotal: 0,
              discountToken: '',
              discountType: '',
              discountAmount: 0,
              discountValue: 0,
              totalAmount: 0,
            };
            this.cartService.add(newCart).subscribe({
              next: () => {
                this.removeItem(item);
                this.toast.success('Moved to cart!', 'top-right', 2000);
              },
            });
          }
        },
      });
    } else {
      // Guest
      this.cartService.addLocalProduct(cartProduct);
      this.removeItem(item);
      this.toast.success('Moved to cart!', 'top-right', 2000);
    }
  }

  moveAllToCart() {
    const allItems = this.items();
    if (allItems.length === 0) return;
    for (const item of allItems) {
      this.addToCartAndRemove(item);
    }
  }

  getViewLink(productId: any) {
    return `/view/${productId}`;
  }
}

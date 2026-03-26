import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, inject, input, Renderer2 } from '@angular/core';
import { BdtPipe } from '../../../../pipes/bdt.pipe';
import { SCart } from '../../../../services/s-cart';
import { SWishlist } from '../../../../services/s-wishlist';
import { SAuthCookie } from '../../../../services/s-auth-cookie';
import { Router } from '@angular/router';
import { CartM, CartProductM } from '../../../../models/Cart';
import { environment } from '../../../../../environments/environment';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHeart } from '@fortawesome/free-regular-svg-icons';
import { faShoppingBag, faMinus, faPlus, faShareAlt } from '@fortawesome/free-solid-svg-icons';
import { SToast } from '../../../../utils/toast/toast.service';

@Component({
  selector: 'app-view-image',
  imports: [CommonModule, BdtPipe, NgOptimizedImage, FontAwesomeModule],
  templateUrl: './view-image.html',
  styleUrl: './view-image.css',
})
export class ViewImage {
  product = input<any>(null);
  cartService = inject(SCart);
  wishListService = inject(SWishlist);
  authCookieService = inject(SAuthCookie);
  renderer = inject(Renderer2);
  router = inject(Router);
  private toast = inject(SToast);
  imgBaseUrl = environment.ImageApi;
  count: number = 1;
  viewImage: any;
  viewSize: any;
  viewColor: any;
  warningMsg: any;
  zoomStyle = {};
  user = this.authCookieService.getUserData();

  faHeart = faHeart;
  faShoppingBag = faShoppingBag;
  faMinus = faMinus;
  faPlus = faPlus;
  faShareAlt = faShareAlt;

  ngOnInit() {
    this.scrollToTop();
  }

  resetWarningMsg(): void {
    this.warningMsg = null;
  }

  get mainImage(): string {
    return this.viewImage || this.imgBaseUrl + this.product()?.imageUrl;
  }

  /** All gallery images: [main, ...images, ...colorImages] */
  get galleryImages(): string[] {
    const images: string[] = [];
    if (this.product()?.imageUrl) {
      images.push(this.imgBaseUrl + this.product()?.imageUrl);
    }
    if (this.product()?.images?.length) {
      for (const img of this.product()?.images) {
        images.push(this.imgBaseUrl + img);
      }
    }
    return images;
  }

  /** Parse sizes from comma-separated string or array */
  get sizeOptions(): string[] {
    if (!this.product()?.sizes) return [];
    if (Array.isArray(this.product()?.sizes)) return this.product()?.sizes;
    return this.product()?.sizes.split(',').map((s: string) => s.trim()).filter((s: string) => s);
  }

  /** Get product colors array (handles both productColors and productsColors) */
  get colorOptions(): any[] {
    return this.product()?.productColors || this.product()?.productsColors || [];
  }

  /** Discount percentage */
  get discountPercent(): number {
    if (this.product()?.discount) return this.product()?.discount;
    if (this.product()?.offerPrice > 0 && this.product()?.regularPrice > 0) {
      return Math.round(((this.product()?.regularPrice - this.product()?.offerPrice) / this.product()?.regularPrice) * 100);
    }
    return 0;
  }

  increase() {
    this.count++;
  }

  decrease() {
    if (this.count > 1) this.count--;
  }

  onViewImageClick(img: string) {
    this.viewImage = img;
  }

  onViewSizeClick(size: string) {
    this.viewSize = this.viewSize === size ? null : size;
  }

  onViewColorClick(color: any) {
    if (this.viewColor?.colorName === color.colorName) {
      this.viewColor = null;
      this.viewImage = null;
    } else {
      this.viewColor = color;
      if (color.image) {
        this.viewImage = this.imgBaseUrl + color.image;
      }
    }
  }

  onMouseMove(event: MouseEvent): void {
    const imageContainer = (event.target as HTMLElement).closest('.image-container');
    const img = imageContainer?.querySelector('img') as HTMLImageElement;
    const zoom = imageContainer?.querySelector('.zoom') as HTMLDivElement;

    if (!img || !zoom || !imageContainer) return;

    const containerRect = imageContainer.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();

    const x = event.clientX - containerRect.left;
    const y = event.clientY - containerRect.top;

    const xPercent = (x / containerRect.width) * 100;
    const yPercent = (y / containerRect.height) * 100;

    const zoomBoxWidth = zoom.offsetWidth;
    const zoomBoxHeight = zoom.offsetHeight;
    const zoomBoxLeft = Math.max(0, Math.min(x - zoomBoxWidth / 2, containerRect.width - zoomBoxWidth));
    const zoomBoxTop = Math.max(0, Math.min(y - zoomBoxHeight / 2, containerRect.height - zoomBoxHeight));

    this.zoomStyle = {
      display: 'block',
      backgroundImage: `url(${img.src})`,
      backgroundPosition: `${xPercent}% ${yPercent}%`,
      left: `${zoomBoxLeft}px`,
      top: `${zoomBoxTop}px`,
      backgroundSize: `${imgRect.width * 2}px ${imgRect.height * 2}px`,
    };
  }

  onMouseLeave(): void {
    this.zoomStyle = { display: 'none' };
  }

  addToCart(product: any) {
    const price = product.offerPrice || product.regularPrice || 0;
    const cartProduct: CartProductM = {
      productId: product.id,
      selectSize: this.viewSize || '',
      selectColor: this.viewColor?.colorName || '',
      quantity: this.count,
      price: price,
      totalPrice: price * this.count,
    };

    const customerId = this.cartService.getCustomerId();

    if (customerId) {
      // Customer logged in → use Cart API
      this.cartService.search(customerId).subscribe({
        next: (cart) => {
          if (cart.length > 0) {
            const userCart: CartM = { ...cart[0] };
            const existIdx = userCart.products.findIndex(
              (p: CartProductM) =>
                p.productId == cartProduct.productId &&
                p.selectSize === cartProduct.selectSize &&
                p.selectColor === cartProduct.selectColor
            );

            if (existIdx !== -1) {
              userCart.products[existIdx].quantity += cartProduct.quantity;
            } else {
              userCart.products.push(cartProduct);
            }

            this.cartService.update(userCart.id!, userCart).subscribe({
              next: () => this.toast.success('Product added to cart!', 'top-right', 2000),
              error: () => this.toast.warning('Failed to add to cart', 'top-right', 3000),
            });
          } else {
            const newCart: CartM = {
              userId: customerId,
              subtotal: 0,
              discountToken: '',
              discountType: '',
              discountValue: 0,
              discountAmount: 0,
              totalAmount: 0,
              products: [cartProduct],
            };
            this.cartService.add(newCart).subscribe({
              next: () => this.toast.success('Product added to cart!', 'top-right', 2000),
              error: () => this.toast.warning('Failed to add to cart', 'top-right', 3000),
            });
          }
        },
        error: () => {
          const newCart: CartM = {
            userId: customerId,
            subtotal: 0,
            discountToken: '',
            discountType: '',
            discountValue: 0,
            discountAmount: 0,
            totalAmount: 0,
            products: [cartProduct],
          };
          this.cartService.add(newCart).subscribe({
            next: () => this.toast.success('Product added to cart!', 'top-right', 2000),
            error: () => this.toast.warning('Failed to add to cart', 'top-right', 3000),
          });
        },
      });
    } else {
      // Guest → store locally
      this.cartService.addLocalProduct(cartProduct);
      this.toast.success('Product added to cart!', 'top-right', 2000);
    }
  }

  addToWishlist(product: any) {
    // const user = this.authCookieService.getUserData();

    const favoriteProduct = {
      id: crypto.randomUUID(),  // Generate a unique ID for the product
      productId: product.id
    };

    if (this.user?.uid) {
      this.wishListService.getWishlist(this.user.uid).subscribe({
        next: (wishlist) => {
          if (wishlist.length > 0) {
            const restFavoriteProduct = wishlist[0];
            // If the wishlist exists, check if the product is already in the wishlist
            const existingProduct = restFavoriteProduct?.products?.find((p: any) => p.productId == favoriteProduct.productId);

            if (existingProduct) {
              // this.toastService.showMessage('warn', 'Warning', 'Product already in the wish list!');
              // console.log("Product already in the wish list");
              return;
            } else {
              // Add the new product to the wishlist
              restFavoriteProduct.products.push(favoriteProduct);
            }

            // Update the wishlist
            this.wishListService.updateWishlist(restFavoriteProduct.id, restFavoriteProduct).subscribe({
              next: () => {
                // console.log('wishlist updated successfully');
                // this.toastService.showMessage('success', 'Successful', 'Product successfully added to wishlist!');
              },
              error: (error) => {
                console.error('Error updating wishlist:', error);
                // this.toastService.showMessage('error', 'Error', `${error.error.status || 'Error'} : ${error.error.message || error.error.title || 'Error creating wishlist'}`);
              }
            });
          } else {
            // If no wishlist exists, create a new wishlist for the user
            const newFavoriteProduct = {
              userId: this.user.uid,
              products: [favoriteProduct]
            };

            this.wishListService.addWishlist(newFavoriteProduct).subscribe({
              next: () => {
                // this.toastService.showMessage('success', 'Successful', 'Product successfully added to wishlist!');
                // this.router.navigateByUrl('user/shopping-wishlist');
              },
              error: (error) => {
                // this.toastService.showMessage('error', 'Error', `${error.error.status || 'Error'} : ${error.error.message || error.error.title || 'Error creating wishlist'}`);
              }
            });
          }
        },
        error: (error) => {
          // this.toastService.showMessage('error', 'Error', `${error.error.status || 'Error'} : ${error.error.message || error.error.title || 'Error fetching wishlist'}`);
        }
      });
    } else {
      // this.toastService.showMessage('warn', 'Warning', 'User not logged in!');
      console.error('User not logged in');
      this.router.navigateByUrl('login');
    }
  }


  scrollToTop() {
    // Scroll to the top of the page
    this.renderer.setProperty(document.documentElement, 'scrollTop', 0);
  }

}

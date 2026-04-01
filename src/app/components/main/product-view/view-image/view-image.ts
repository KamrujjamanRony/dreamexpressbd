import { CommonModule } from '@angular/common';
import { Component, inject, input, Renderer2 } from '@angular/core';
import { BdtPipe } from '../../../../pipes/bdt.pipe';
import { SCart } from '../../../../services/s-cart';
import { SWishlist } from '../../../../services/s-wishlist';
import { CartM, CartProductM } from '../../../../models/Cart';
import { environment } from '../../../../../environments/environment';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHeart } from '@fortawesome/free-regular-svg-icons';
import { faShoppingBag, faMinus, faPlus, faShareAlt } from '@fortawesome/free-solid-svg-icons';
import { SToast } from '../../../../utils/toast/toast.service';
import { CartDrawerService } from '../../../../utils/cart-drawer/cart-drawer.service';

@Component({
  selector: 'app-view-image',
  imports: [CommonModule, BdtPipe, FontAwesomeModule],
  templateUrl: './view-image.html',
  styleUrl: './view-image.css',
})
export class ViewImage {
  product = input<any>(null);
  cartService = inject(SCart);
  wishListService = inject(SWishlist);
  renderer = inject(Renderer2);
  private toast = inject(SToast);
  private cartDrawer = inject(CartDrawerService);
  imgBaseUrl = environment.ImageApi;
  count: number = 1;
  viewImage: any;
  viewSize: any;
  viewColor: any;
  warningMsg: any;
  zoomStyle = {};

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

  private toDisplayUrl(value?: string | null): string {
    if (!value) return '';
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
      return value;
    }
    return `${this.imgBaseUrl}${value}`;
  }

  get mainImage(): string {
    return this.toDisplayUrl(this.viewImage || this.product()?.resolvedImageUrl || '');
  }

  /** All gallery images: [main, ...images, ...colorImages] */
  get galleryImages(): string[] {
    const images: string[] = [];
    if (this.product()?.resolvedImageUrl) {
      images.push(this.toDisplayUrl(this.product()?.resolvedImageUrl));
    }
    if (this.product()?.resolvedImages?.length) {
      for (const img of this.product()?.resolvedImages) {
        images.push(this.toDisplayUrl(img));
      }
    }
    return images;
  }

  getColorDisplayUrl(color: any): string {
    return this.toDisplayUrl(color?.resolvedUrl || '');
  }

  get catalogLink(): string {
    const raw = (this.product()?.catalogURL || '').trim();
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }
    return `https://${raw}`;
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
    if (this.viewColor?.cn === color.cn) {
      this.viewColor = null;
      this.viewImage = null;
    } else {
      this.viewColor = color;
      if (color.resolvedUrl) {
        this.viewImage = this.toDisplayUrl(color.resolvedUrl);
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
      selectColor: this.viewColor?.cn || '',
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
              next: () => { this.toast.success('Product added to cart!', 'top-left', 2000); this.cartDrawer.open(); },
              error: (e) => this.toast.warning(e?.error || 'Failed to add to cart', 'top-left', 3000),
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
              next: () => { this.toast.success('Product added to cart!', 'top-left', 2000); this.cartDrawer.open(); },
              error: (e) => this.toast.warning(e?.error || 'Failed to add to cart', 'top-left', 3000),
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
            next: () => { this.toast.success('Product added to cart!', 'top-left', 2000); this.cartDrawer.open(); },
            error: (e) => this.toast.warning(e?.error || 'Failed to add to cart', 'top-left', 3000),
          });
        },
      });
    } else {
      // Guest → store locally
      this.cartService.addLocalProduct(cartProduct);
      this.toast.success('Product added to cart!', 'top-left', 2000);
      this.cartDrawer.open();
    }
  }

  addToWishlist(product: any) {
    if (!product) return;
    this.wishListService.toggleWishlist(
      product.id?.toString(),
      this.viewSize || '',
      this.viewColor?.colorName || ''
    );
    this.toast.success('Wishlist updated!', 'top-left', 2000);
  }


  scrollToTop() {
    // Scroll to the top of the page
    this.renderer.setProperty(document.documentElement, 'scrollTop', 0);
  }

}

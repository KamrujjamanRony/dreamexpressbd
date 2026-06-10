import { NgClass, NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, Renderer2, SimpleChanges } from '@angular/core';
import { BdtPipe } from '../../../../pipes/bdt.pipe';
import { Router } from '@angular/router';
import { SCart } from '../../../../services/s-cart';
import { SToast } from '../../../../utils/toast/toast.service';
import { CartDrawerService } from '../../../../utils/cart-drawer/cart-drawer.service';
import { CartProductM } from '../../../../models/Cart';
import { environment } from '../../../../../environments/environment';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faShoppingBag, faMinus, faPlus, faShareAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-view-image',
  imports: [NgClass, NgStyle, BdtPipe, FontAwesomeModule],
  templateUrl: './view-image.html',
  styleUrl: './view-image.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewImage {
  product = input<any>(null);
  private router = inject(Router);
  private cartService = inject(SCart);
  private toast = inject(SToast);
  private cartDrawer = inject(CartDrawerService);
  renderer = inject(Renderer2);
  imgBaseUrl = environment.ImageApi;
  count: number = 1;
  viewImage: any;
  viewSize: any;
  viewColor: any;
  warningMsg: any;
  zoomStyle = {};

  faShoppingBag = faShoppingBag;
  faMinus = faMinus;
  faPlus = faPlus;
  faShareAlt = faShareAlt;

  ngOnInit() {
    this.scrollToTop();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['product'] && !changes['product'].firstChange) {
      this.viewImage = null;
      this.viewColor = null;
      this.viewSize = null;
      this.count = 1;
      this.warningMsg = null;
      this.zoomStyle = {};
      this.scrollToTop();
    }
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
    if (!product) return;

    const price = product.offerPrice || product.regularPrice || 0;
    const item: CartProductM = {
      productId: product.id,
      quantity: this.count,
      selectSize: this.viewSize || '',
      selectColor: this.viewColor?.cn || '',
      price,
      totalPrice: price * this.count,
    };

    this.cartService.addLocalProduct(item);
    this.cartService.refreshCartCount();
    this.toast.success('Added to cart', 'top-left', 1800);
    this.cartDrawer.open();
  }

  buyNow(product: any) {
    if (!product) return;

    const price = product.offerPrice || product.regularPrice || 0;
    const orderData = {
      subtotal: price * this.count,
      products: [{
        productId: product.id,
        productName: product.title || product.name || 'Product',
        selectSize: this.viewSize || '',
        selectColor: this.viewColor?.cn || '',
        quantity: this.count,
        price,
        totalPrice: price * this.count,
        image: product.resolvedImageUrl || '',
      }],
    };
    this.router.navigate(['/checkout'], { state: { orderData } });
  }


  scrollToTop() {
    // Scroll to the top of the page
    this.renderer.setProperty(document.documentElement, 'scrollTop', 0);
  }

}

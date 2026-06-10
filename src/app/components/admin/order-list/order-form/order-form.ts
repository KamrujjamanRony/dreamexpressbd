// order-form.component.ts
import { Component, EventEmitter, inject, Input, Output, signal, computed, effect, OnChanges, SimpleChanges, untracked, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormField, form, required, validate, debounce } from '@angular/forms/signals';
import { OrderM, OrderItemM } from '../../../../models/OrderM';
import { ProductM, ProductColorM } from '../../../../models/Products';
import { SProduct } from '../../../../services/s-product';
import { SContact } from '../../../../services/s-contact';
import { SGallery } from '../../../../services/s-gallery';
import { environment } from '../../../../../environments/environment';
import { BdtPipe } from '../../../../pipes/bdt.pipe';

interface OrderFormModel {
  companyID: number;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  paymentMethod: string;
  orderStatus: string;
  orderDate: string;
  shippingAddress: {
    district: string;
    city: string;
    street: string;
    contact: string;
    type: string;
  };
}

@Component({
  selector: 'app-order-form',
  imports: [CommonModule, FormsModule, FormField, BdtPipe],
  templateUrl: './order-form.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './order-form.css',
})
export class OrderForm implements OnChanges {
  @Input() selectedOrder: OrderM | null = null;
  @Input() modalTitle: string = 'Order Form';
  @Input() isSubmitted = false;

  @Output() submitForm = new EventEmitter<Partial<OrderM>>();
  @Output() cancel = new EventEmitter<void>();

  private productService = inject(SProduct);
  private contactService = inject(SContact);
  private galleryService = inject(SGallery);

  siteId = environment.companyCode;
  imgBaseUrl = environment.ImageApi;
  private deliveryCharges: Array<{ name: string; charge: number }> = [
    { name: 'Inside Dhaka', charge: 60 },
    { name: 'Outside Dhaka', charge: 120 },
  ];

  // Selected product for size/color picking
  pendingProduct = signal<ProductM | null>(null);
  selectedSize = signal<string>('');
  selectedColor = signal<string>('');

  // Product selection state
  products = signal<ProductM[]>([]);
  productSearch = signal('');
  showProductDropdown = signal(false);
  orderItems = signal<OrderItemM[]>([]);
  cityOptions = ['Inside Dhaka', 'Outside Dhaka'];

  filteredProducts = computed(() => {
    const query = this.productSearch().toLowerCase();
    if (!query) return this.products().slice(0, 20);
    return this.products().filter(p =>
      p.title?.toLowerCase().includes(query)
    ).slice(0, 20);
  });

  // Auto-calculate subtotal from order items
  calculatedSubtotal = computed(() =>
    this.orderItems().reduce((sum, item) => sum + (item.price * item.quantity), 0)
  );

  /* ---------------- FORM MODEL ---------------- */
  model = signal<OrderFormModel>({
    companyID: environment.companyCode,
    userId: '',
    userEmail: '',
    userName: '',
    userPhone: '',
    subtotal: 0,
    deliveryCharge: 120,
    totalAmount: 0,
    paymentMethod: 'Cash on Delivery',
    orderStatus: 'Pending',
    orderDate: new Date().toISOString(),
    shippingAddress: {
      district: '',
      city: '',
      street: '',
      contact: '',
      type: 'Home'
    }
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (s) => {
    required(s.userName, { message: 'Customer name is required' });
    required(s.paymentMethod, { message: 'Payment method is required' });

    validate(s.subtotal, ({ value }) => {
      if (value() <= 0) {
        return { kind: 'invalid', message: 'Subtotal must be greater than 0' };
      }
      return null;
    });

    required(s.shippingAddress.district, { message: 'Division is required' });
    required(s.shippingAddress.city, { message: 'City is required' });
    required(s.shippingAddress.street, { message: 'Street is required' });
    required(s.shippingAddress.contact, { message: 'Contact number is required' });

    validate(s.shippingAddress.contact, ({ value }) => {
      const v = value();
      if (v && !/^(?:\+88|88)?(01[3-9]\d{8})$/.test(v)) {
        return { kind: 'invalid', message: 'Please enter a valid Bangladeshi phone number' };
      }
      return null;
    });

    debounce(s.userName, 300);
    debounce(s.userEmail, 300);
  });

  paymentMethods = [
    { label: 'Cash on Delivery', value: 'Cash on Delivery' },
    // { label: 'Online Payment', value: 'OnlinePayment' },
    // { label: 'Bkash', value: 'Bkash' },
    // { label: 'Nagad', value: 'Nagad' },
    // { label: 'Rocket', value: 'Rocket' }
  ];

  /* ---------------- COMPUTED VALUES ---------------- */
  totalAmount = computed(() => {
    const m = this.model();
    return Math.max(0, (m.subtotal || 0) + (m.deliveryCharge || 0));
  });

  /* ---------------- EFFECTS ---------------- */
  constructor() {
    // Load products
    this.productService.search(0, 0, '', 1).subscribe(products => this.products.set(products));

    // Load delivery charges from API using the same behavior as checkout
    this.contactService.get(this.siteId).subscribe({
      next: (contact) => {
        const apiCharges = (contact?.deliveryCharges || []).map((d: any) => ({
          name: d?.name || '',
          charge: Number(d?.amount ?? d?.charge ?? 0),
        }));

        this.deliveryCharges = apiCharges.length
          ? apiCharges
          : [
            { name: 'Inside Dhaka', charge: 60 },
            { name: 'Outside Dhaka', charge: 120 },
          ];

        const city = (this.model().shippingAddress.city || '').trim();
        if (city) {
          this.model.update(m => ({ ...m, deliveryCharge: this.getDeliveryChargeForCity(city) }));
          return;
        }

        const outside = this.deliveryCharges.find(
          d => this.normalizeCityName(d.name) === 'Outside Dhaka'
        );
        if (outside) {
          this.model.update(m => ({ ...m, deliveryCharge: outside.charge }));
        }
      },
      error: () => {
        this.deliveryCharges = [
          { name: 'Inside Dhaka', charge: 60 },
          { name: 'Outside Dhaka', charge: 120 },
        ];
        this.model.update(m => ({ ...m, deliveryCharge: 120 }));
      }
    });

    // Sync subtotal from orderItems
    effect(() => {
      const subtotal = this.calculatedSubtotal();
      const current = untracked(() => this.model().subtotal);
      if (current !== subtotal) {
        this.model.update(m => ({ ...m, subtotal }));
      }
    });

    // Sync totalAmount back to model
    effect(() => {
      const total = this.totalAmount();
      const current = untracked(() => this.model().totalAmount);
      if (current !== total) {
        this.model.update(m => ({ ...m, totalAmount: total }));
      }
    });

    // Auto-calculate delivery charge based on city
    effect(() => {
      const city = this.form.shippingAddress.city().value().toLowerCase();
      if (!city) return;

      const charge = this.getDeliveryChargeForCity(city);
      const currentCharge = untracked(() => this.model().deliveryCharge);
      if (currentCharge !== charge) {
        this.model.update(m => ({ ...m, deliveryCharge: charge }));
      }
    });
  }

  onCityChange(city: string) {
    const normalized = this.normalizeCityName(city);
    this.model.update(m => ({
      ...m,
      shippingAddress: { ...m.shippingAddress, city: normalized, district: normalized }
    }));
    if (normalized) {
      this.model.update(m => ({ ...m, deliveryCharge: this.getDeliveryChargeForCity(normalized) }));
    }
  }

  private normalizeCityName(value: string): string {
    const lower = (value || '').toLowerCase();
    if (lower.includes('inside')) return 'Inside Dhaka';
    if (lower.includes('outside')) return 'Outside Dhaka';
    if (lower.includes('dhaka')) return 'Inside Dhaka';
    return 'Outside Dhaka';
  }

  private getDeliveryChargeForCity(city: string): number {
    const normalized = this.normalizeCityName(city);
    const found = this.deliveryCharges.find(
      c => this.normalizeCityName(c.name) === normalized
    );

    if (found) {
      return found.charge;
    }

    return normalized === 'Inside Dhaka' ? 60 : 120;
  }

  /* ---------------- LIFECYCLE ---------------- */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedOrder'] && this.selectedOrder) {
      this.loadOrderData();
    } else if (changes['selectedOrder'] && !this.selectedOrder) {
      this.resetForm();
    }
  }

  loadOrderData() {
    if (!this.selectedOrder) return;

    const o = this.selectedOrder;
    const subtotal = o.subtotal || 0;
    const deliveryCharge = o.deliveryCharge || 120;
    this.model.set({
      companyID: o.companyID || environment.companyCode,
      userId: o.userId || '',
      userEmail: o.userEmail || '',
      userName: o.userName || '',
      userPhone: o.userPhone || '',
      subtotal,
      deliveryCharge,
      totalAmount: o.totalAmount || 0,
      paymentMethod: o.paymentMethod || 'Cash on Delivery',
      orderStatus: o.orderStatus || 'Pending',
      orderDate: o.orderDate || new Date().toISOString(),
      shippingAddress: {
        district: o.shippingAddress?.district || '',
        city: o.shippingAddress?.city || '',
        street: o.shippingAddress?.street || '',
        contact: o.shippingAddress?.contact || '',
        type: o.shippingAddress?.type || 'Home'
      }
    });

    // Load order items
    const rawItems: any = this.selectedOrder.orderItems || (this.selectedOrder as any).OrderItems;
    const items = rawItems?.$values || rawItems || [];
    if (items.length) {
      this.orderItems.set(items.map((item: any) => {
        const pid = item.productId ?? item.ProductId;
        const matched = this.products().find(p => String(p.id) === String(pid));
        const colorImage = matched && (item.color ?? item.Color)
          ? this.getColorImage(matched, item.color ?? item.Color)
          : '';
        const resolvedFile = colorImage || matched?.resolvedImageUrl || '';
        const rawImage = item.image ?? item.Image ?? '';
        const display = resolvedFile ? this.imgBaseUrl + resolvedFile : this.resolveImageUrl(rawImage);
        return {
          productId: pid,
          productName: item.productName ?? item.ProductName ?? '',
          quantity: item.quantity ?? item.Quantity ?? 1,
          price: item.price ?? item.Price ?? 0,
          size: item.size ?? item.Size ?? '',
          color: item.color ?? item.Color ?? '',
          image: rawImage,
          displayImage: display,
        };
      }));
    }

    this.resolveOrderItemImages(this.orderItems() as OrderItemM[]);
    this.form().reset();
  }

  private isLikelyGalleryId(value: string): boolean {
    if (!value) return false;
    if (/^(https?:)?\/\//i.test(value)) return false;
    if (value.startsWith('data:') || value.startsWith('blob:')) return false;
    if (value.includes('/') || value.includes('\\') || value.includes('.')) return false;
    return true;
  }

  private resolveImageUrl(image: any): string {
    const value = (image ?? '').toString().trim();
    if (!value) return '';
    if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
      return value;
    }
    if (this.isLikelyGalleryId(value)) {
      return '';
    }
    return `${this.imgBaseUrl}${value}`;
  }

  private resolveOrderItemImages(items: OrderItemM[]) {
    const galleryIds = Array.from(new Set(
      items
        .map(item => (item.image || '').toString().trim())
        .filter(id => this.isLikelyGalleryId(id))
    ));

    if (!galleryIds.length) return;

    this.galleryService.search(undefined, 'Product').subscribe({
      next: (gallery) => {
        const galleryMap = new Map<string, string>();
        for (const g of gallery || []) {
          if (g?.id && g?.imageUrl) {
            galleryMap.set(String(g.id), g.imageUrl);
          }
        }

        this.orderItems.update(currentItems => currentItems.map(item => {
          const raw = (item.image || '').toString().trim();
          if (!this.isLikelyGalleryId(raw)) {
            return item;
          }
          const resolvedFile = galleryMap.get(raw) || '';
          return resolvedFile
            ? { ...item, displayImage: `${this.imgBaseUrl}${resolvedFile}` }
            : item;
        }));
      },
      error: () => {
        // Keep existing display images if gallery lookup fails.
      }
    });
  }

  resetForm() {
    this.model.set({
      companyID: environment.companyCode,
      userId: '',
      userEmail: '',
      userName: '',
      userPhone: '',
      subtotal: 0,
      deliveryCharge: 120,
      totalAmount: 0,
      paymentMethod: 'Cash on Delivery',
      orderStatus: 'Pending',
      orderDate: new Date().toISOString(),
      shippingAddress: {
        district: '',
        city: '',
        street: '',
        contact: '',
        type: 'Home'
      }
    });

    this.orderItems.set([]);
    this.productSearch.set('');
    this.form().reset();
  }

  onSubmit(event: Event) {
    event.preventDefault();

    if (!this.form().valid()) {
      return;
    }

    const formValue = this.model();
    const normalizedUserId = (formValue.userId || '').toString().trim() || 'guest';
    const orderData: Partial<OrderM> = {
      ...formValue,
      userId: normalizedUserId,
      userPhone: formValue.shippingAddress.contact,
      totalAmount: this.totalAmount(),
      id: this.selectedOrder?.id,
      orderDate: formValue.orderDate || new Date().toISOString(),
      orderItems: this.orderItems().map((item: any) => ({
        ...item,
        image: item.image || item.displayImage || '',
      })),
    };

    this.submitForm.emit(orderData);
  }

  /* ---------------- PRODUCT SELECTION ---------------- */
  addProduct(product: ProductM) {
    const hasSizes = product.sizes && product.sizes.trim().length > 0;
    const hasColors = this.getProductColors(product).length > 0;

    if (hasSizes || hasColors) {
      // Show size/color picker
      this.pendingProduct.set(product);
      this.selectedSize.set('');
      this.selectedColor.set('');
      this.productSearch.set('');
      this.showProductDropdown.set(false);
      return;
    }

    this.addProductToItems(product, '', '');
  }

  confirmAddProduct() {
    const product = this.pendingProduct();
    if (!product) return;
    this.addProductToItems(product, this.selectedSize(), this.selectedColor());
    this.pendingProduct.set(null);
    this.selectedSize.set('');
    this.selectedColor.set('');
  }

  cancelAddProduct() {
    this.pendingProduct.set(null);
    this.selectedSize.set('');
    this.selectedColor.set('');
  }

  getProductSizes(product: ProductM): string[] {
    if (!product.sizes) return [];
    return product.sizes.split(',').map(s => s.trim()).filter(s => s);
  }

  /** Extract productsColors array handling both property names and $values wrapping */
  private getColorsArray(product: any): ProductColorM[] {
    const raw = product.productColors || product.productsColors;
    if (!raw) return [];
    const arr = raw.$values || raw;
    return Array.isArray(arr) ? arr : [];
  }

  getProductColors(product: ProductM): string[] {
    return this.getColorsArray(product).map(c => c.cn).filter(c => c);
  }

  getProductColorsWithImage(product: ProductM): { cn: string; resolvedUrl: string }[] {
    return this.getColorsArray(product).filter(c => c.cn).map(c => ({
      cn: c.cn,
      resolvedUrl: c.resolvedUrl ? this.imgBaseUrl + c.resolvedUrl : ''
    }));
  }

  getProductImageUrl(product: ProductM): string {
    const file = product.resolvedImageUrl || '';
    return file ? this.imgBaseUrl + file : '';
  }

  getColorImage(product: ProductM, colorName: string): string {
    const match = this.getColorsArray(product).find(c => c.cn === colorName);
    const file = match?.resolvedUrl || '';
    return file ? this.imgBaseUrl + file : '';
  }

  private addProductToItems(product: ProductM, size: string, color: string) {
    const existing = this.orderItems().find(i =>
      i.productId === product.id && (i.size || '') === size && (i.color || '') === color
    );
    if (existing) {
      this.orderItems.update(items =>
        items.map(i => i.productId === product.id && (i.size || '') === size && (i.color || '') === color
          ? { ...i, quantity: i.quantity + 1 } : i)
      );
    } else {
      // Send displayable image (same approach checkout uses) to avoid broken thumbnails later.
      let imageValue = product.imageUrl || '';
      let displayUrl = product.resolvedImageUrl ? this.imgBaseUrl + product.resolvedImageUrl : '';
      if (color) {
        const matched = this.getColorsArray(product).find(c => c.cn === color);
        if (matched?.id) imageValue = matched.id;
        if (matched?.resolvedUrl) displayUrl = this.imgBaseUrl + matched.resolvedUrl;
      }
      const item: OrderItemM = {
        productId: product.id!,
        productName: product.title,
        quantity: 1,
        price: product.offerPrice || product.regularPrice || 0,
        size: size || '',
        color: color || '',
        image: imageValue,
        displayImage: displayUrl,
      };
      this.orderItems.update(items => [...items, item]);
      if (!displayUrl && this.isLikelyGalleryId(imageValue)) {
        this.resolveOrderItemImages([{ ...item }]);
      }
    }
    this.productSearch.set('');
    this.showProductDropdown.set(false);
  }

  removeItem(productId: number, size?: string, color?: string) {
    this.orderItems.update(items => items.filter(i =>
      !(i.productId === productId && (i.size || '') === (size || '') && (i.color || '') === (color || ''))
    ));
  }

  updateItemQuantity(productId: number, qty: number, size?: string, color?: string) {
    if (qty < 1) return;
    this.orderItems.update(items =>
      items.map(i => i.productId === productId && (i.size || '') === (size || '') && (i.color || '') === (color || '')
        ? { ...i, quantity: qty } : i)
    );
  }

  onProductSearch(event: Event) {
    this.productSearch.set((event.target as HTMLInputElement).value);
    this.showProductDropdown.set(true);
  }

  onCancel() {
    this.cancel.emit();
  }
}

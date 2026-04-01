// order-form.component.ts
import { Component, EventEmitter, inject, Input, Output, signal, computed, effect, OnChanges, SimpleChanges, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormField, form, required, validate, debounce } from '@angular/forms/signals';
import { finalize } from 'rxjs';
import { OrderM, OrderItemM } from '../../../../models/OrderM';
import { TokenM } from '../../../../models/TokenM';
import { ProductM, ProductColorM } from '../../../../models/Products';
import { SToken } from '../../../../services/s-token';
import { SProduct } from '../../../../services/s-product';
import { SContact } from '../../../../services/s-contact';
import { SData } from '../../../../services/s-data';
import { DeliveryChargeM } from '../../../../models/Contact';
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
  discountToken: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
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
  styleUrl: './order-form.css',
})
export class OrderForm implements OnChanges {
  @Input() selectedOrder: OrderM | null = null;
  @Input() modalTitle: string = 'Order Form';
  @Input() isSubmitted = false;

  @Output() submitForm = new EventEmitter<Partial<OrderM>>();
  @Output() cancel = new EventEmitter<void>();

  private tokenService = inject(SToken);
  private productService = inject(SProduct);
  private contactService = inject(SContact);
  private dataService = inject(SData);

  siteId = environment.companyCode;
  imgBaseUrl = environment.ImageApi;
  apiDeliveryCharges = signal<DeliveryChargeM[]>([]);

  // Address dropdown data
  regions = signal<any[]>([]);
  cities = signal<any[]>([]);
  areas = signal<any[]>([]);

  // Selected product for size/color picking
  pendingProduct = signal<ProductM | null>(null);
  selectedSize = signal<string>('');
  selectedColor = signal<string>('');

  // Product selection state
  products = signal<ProductM[]>([]);
  productSearch = signal('');
  showProductDropdown = signal(false);
  orderItems = signal<OrderItemM[]>([]);

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

  // Discount token state
  tokenCode = '';
  tokenError = signal('');
  tokenApplied = signal(false);
  tokenLoading = signal(false);

  /* ---------------- FORM MODEL ---------------- */
  model = signal<OrderFormModel>({
    companyID: environment.companyCode,
    userId: '',
    userEmail: '',
    userName: '',
    userPhone: '',
    subtotal: 0,
    deliveryCharge: 120,
    discountToken: '',
    discountType: '',
    discountValue: 0,
    discountAmount: 0,
    totalAmount: 0,
    paymentMethod: 'CashOnDelivery',
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
    required(s.userPhone, { message: 'Phone is required' });

    validate(s.userPhone, ({ value }) => {
      const v = value();
      if (v && !/^(?:\+88|88)?(01[3-9]\d{8})$/.test(v)) {
        return { kind: 'invalid', message: 'Please enter a valid Bangladeshi phone number' };
      }
      return null;
    });

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
    debounce(s.userPhone, 300);
  });

  paymentMethods = [
    { label: 'Cash on Delivery', value: 'CashOnDelivery' },
    // { label: 'Online Payment', value: 'OnlinePayment' },
    // { label: 'Bkash', value: 'Bkash' },
    // { label: 'Nagad', value: 'Nagad' },
    // { label: 'Rocket', value: 'Rocket' }
  ];

  /* ---------------- COMPUTED VALUES ---------------- */
  totalAmount = computed(() => {
    const m = this.model();
    return Math.max(0, (m.subtotal || 0) + (m.deliveryCharge || 0) - (m.discountAmount || 0));
  });

  /* ---------------- EFFECTS ---------------- */
  constructor() {
    // Load products
    this.productService.search().subscribe(products => this.products.set(products));

    // Load regions for division dropdown
    this.dataService.getRegions().subscribe(regions => this.regions.set(regions));

    // Load delivery charges from API & set default to outside Dhaka
    this.contactService.get(this.siteId).subscribe({
      next: (data) => {
        const activeCharges = (data.deliveryCharges || []).filter(c => c.isActive);
        this.apiDeliveryCharges.set(activeCharges);
        this.setDefaultDeliveryCharge();
      },
      error: () => {
        // fallback default: outside Dhaka
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

      const tokenApplied = this.tokenApplied();
      const discountType = untracked(() => this.model().discountType);
      // Only update if token doesn't grant free delivery
      if (!tokenApplied || discountType !== 'FreeDelivery') {
        const charge = this.getDeliveryChargeForCity(city);
        const currentCharge = untracked(() => this.model().deliveryCharge);
        if (currentCharge !== charge) {
          this.model.update(m => ({ ...m, deliveryCharge: charge }));
        }
      }
    });
  }

  onDistrictChange(district: string) {
    this.model.update(m => ({
      ...m,
      shippingAddress: { ...m.shippingAddress, district, city: '', street: m.shippingAddress.street, contact: m.shippingAddress.contact, type: m.shippingAddress.type }
    }));
    this.cities.set([]);
    this.areas.set([]);
    if (district) {
      this.dataService.getCitiesByRegion(district).subscribe(cities => this.cities.set(cities));
    }
  }

  onCityChange(city: string) {
    this.model.update(m => ({
      ...m,
      shippingAddress: { ...m.shippingAddress, city }
    }));
    this.areas.set([]);
    if (city) {
      this.dataService.getAreasByCity(city).subscribe(areas => this.areas.set(areas));
    }
  }

  onAreaChange(area: string) {
    // Append area to street if needed or store separately
    // For now just update street prefix
  }

  private setDefaultDeliveryCharge() {
    const charges = this.apiDeliveryCharges();
    if (charges.length > 0) {
      const outsideCharge = charges.find(c => c.name.toLowerCase().includes('outside'));
      this.model.update(m => ({ ...m, deliveryCharge: outsideCharge ? outsideCharge.amount : charges[charges.length - 1].amount }));
    } else {
      this.model.update(m => ({ ...m, deliveryCharge: 120 }));
    }
  }

  private getDeliveryChargeForCity(city: string): number {
    city = (city || '').toLowerCase();
    const charges = this.apiDeliveryCharges();

    if (charges.length > 0) {
      const match = charges.find(c =>
        city.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(city)
      );
      if (match) return match.amount;
      if (city.includes('dhaka')) {
        const dhakaCharge = charges.find(c => c.name.toLowerCase().includes('dhaka'));
        return dhakaCharge ? dhakaCharge.amount : charges[charges.length - 1].amount;
      }
      const outsideCharge = charges.find(c => c.name.toLowerCase().includes('outside'));
      return outsideCharge ? outsideCharge.amount : charges[charges.length - 1].amount;
    }
    return city.includes('dhaka') ? 60 : 120;
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
    const discountToken = o.discountToken || '';
    const discountType = o.discountType || '';
    const discountValue = o.discountValue || 0;
    let discountAmount = o.discountAmount || 0;

    // Recalculate discountAmount when backend returns 0 but discount token exists
    if (!discountAmount && discountToken && discountValue > 0) {
      if (discountType === 'Percentage') {
        discountAmount = Math.min(Math.round((subtotal * discountValue) / 100), subtotal);
      } else if (discountType === 'Fixed') {
        discountAmount = Math.min(discountValue, subtotal);
      } else if (discountType === 'FreeDelivery') {
        discountAmount = 0;
      }
    }

    this.model.set({
      companyID: o.companyID || environment.companyCode,
      userId: o.userId || '',
      userEmail: o.userEmail || '',
      userName: o.userName || '',
      userPhone: o.userPhone || '',
      subtotal,
      deliveryCharge: discountType === 'FreeDelivery' ? 0 : deliveryCharge,
      discountToken,
      discountType,
      discountValue,
      discountAmount,
      totalAmount: o.totalAmount || 0,
      paymentMethod: o.paymentMethod || 'CashOnDelivery',
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

    if (this.selectedOrder.discountToken) {
      this.tokenCode = this.selectedOrder.discountToken;
      this.tokenApplied.set(true);
    }

    // Load cities/areas for existing order address
    const district = o.shippingAddress?.district || '';
    const city = o.shippingAddress?.city || '';
    if (district) {
      this.dataService.getCitiesByRegion(district).subscribe(cities => this.cities.set(cities));
    }
    if (city) {
      this.dataService.getAreasByCity(city).subscribe(areas => this.areas.set(areas));
    }

    // Load order items
    const rawItems: any = this.selectedOrder.orderItems || (this.selectedOrder as any).OrderItems;
    const items = rawItems?.$values || rawItems || [];
    if (items.length) {
      this.orderItems.set(items.map((item: any) => ({
        productId: item.productId ?? item.ProductId,
        productName: item.productName ?? item.ProductName ?? '',
        quantity: item.quantity ?? item.Quantity ?? 1,
        price: item.price ?? item.Price ?? 0,
        size: item.size ?? item.Size ?? '',
        color: item.color ?? item.Color ?? '',
        image: item.image ?? item.Image ?? '',
      })));
    }

    this.form().reset();
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
      discountToken: '',
      discountType: '',
      discountValue: 0,
      discountAmount: 0,
      totalAmount: 0,
      paymentMethod: 'CashOnDelivery',
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

    this.tokenCode = '';
    this.tokenError.set('');
    this.tokenApplied.set(false);
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
    const orderData: Partial<OrderM> = {
      ...formValue,
      totalAmount: this.totalAmount(),
      id: this.selectedOrder?.id,
      orderDate: formValue.orderDate || new Date().toISOString(),
      orderItems: this.orderItems(),
    };

    this.submitForm.emit(orderData);
  }

  /* ---------------- DISCOUNT TOKEN ---------------- */
  applyToken() {
    const code = this.tokenCode.trim();
    if (!code) {
      this.tokenError.set('Please enter a token code');
      return;
    }

    this.tokenLoading.set(true);
    this.tokenError.set('');

    this.tokenService.search().pipe(
      finalize(() => this.tokenLoading.set(false))
    ).subscribe({
      next: (tokens: TokenM[]) => {
        const token = tokens.find(t => t.code.toLowerCase() === code.toLowerCase());

        if (!token) {
          this.tokenError.set('This discount code does not exist');
          return;
        }

        if (!token.isActive) {
          this.tokenError.set('This discount code is inactive');
          return;
        }

        if (new Date(token.expireAt) < new Date()) {
          this.tokenError.set('This discount code has expired');
          return;
        }

        if (token.usedCount >= token.maxUseCount) {
          this.tokenError.set('This discount code has reached its usage limit');
          return;
        }

        const subtotal = this.model().subtotal;

        if (token.type === 'FreeDelivery') {
          this.model.update(m => ({
            ...m,
            deliveryCharge: 0,
            discountToken: token.code,
            discountType: 'FreeDelivery',
            discountValue: token.value,
            discountAmount: 0
          }));
        } else if (token.type === 'Percentage') {
          const discountAmount = Math.min(Math.round((subtotal * token.value) / 100), subtotal);
          this.model.update(m => ({
            ...m,
            discountToken: token.code,
            discountType: 'Percentage',
            discountValue: token.value,
            discountAmount
          }));
        } else {
          const discountAmount = Math.min(token.value, subtotal);
          this.model.update(m => ({
            ...m,
            discountToken: token.code,
            discountType: 'Fixed',
            discountValue: token.value,
            discountAmount
          }));
        }

        this.tokenApplied.set(true);
      },
      error: (error) => {
        this.tokenError.set(error?.error || 'Failed to validate token');
      }
    });
  }

  removeToken() {
    const city = this.form.shippingAddress.city().value().toLowerCase();
    const charge = this.getDeliveryChargeForCity(city);

    this.model.update(m => ({
      ...m,
      deliveryCharge: charge,
      discountToken: '',
      discountType: '',
      discountValue: 0,
      discountAmount: 0
    }));

    this.tokenCode = '';
    this.tokenError.set('');
    this.tokenApplied.set(false);
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
    return this.getColorsArray(product).filter(c => c.cn).map(c => ({ cn: c.cn, resolvedUrl: c.resolvedUrl || '' }));
  }

  getProductImageUrl(product: ProductM): string {
    return product.resolvedImageUrl || product.imageUrl || '';
  }

  getColorImage(product: ProductM, colorName: string): string {
    const match = this.getColorsArray(product).find(c => c.cn === colorName);
    return match?.resolvedUrl || '';
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
      // Use color variant image if a color is selected, otherwise use product image
      let itemImage = product.resolvedImageUrl || product.imageUrl || '';
      if (color) {
        const colorImage = this.getColorImage(product, color);
        if (colorImage) itemImage = colorImage;
      }
      const item: OrderItemM = {
        productId: product.id!,
        productName: product.title,
        quantity: 1,
        price: product.offerPrice || product.regularPrice || 0,
        size: size || '',
        color: color || '',
        image: itemImage
      };
      this.orderItems.update(items => [...items, item]);
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
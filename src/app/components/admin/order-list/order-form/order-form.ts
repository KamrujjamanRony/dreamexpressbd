// order-form.component.ts
import { Component, EventEmitter, inject, Input, Output, signal, computed, effect, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormField, form, required, validate, debounce } from '@angular/forms/signals';
import { finalize } from 'rxjs';
import { OrderM, OrderItemM } from '../../../../models/OrderM';
import { TokenM } from '../../../../models/TokenM';
import { ProductM } from '../../../../models/Products';
import { SToken } from '../../../../services/s-token';
import { SProduct } from '../../../../services/s-product';
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
    deliveryCharge: 60,
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

    required(s.shippingAddress.district, { message: 'District is required' });
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

    // Sync subtotal from orderItems
    effect(() => {
      const subtotal = this.calculatedSubtotal();
      this.model.update(m => ({ ...m, subtotal }));
    });

    // Sync totalAmount back to model
    effect(() => {
      const total = this.totalAmount();
      this.model.update(m => ({ ...m, totalAmount: total }));
    });

    // Auto-calculate delivery charge based on district
    effect(() => {
      const district = this.form.shippingAddress.district().value().toLowerCase();
      if (!district) return;

      const charge = district.includes('dhaka') ? 60 : 120;
      // Only update if token doesn't grant free delivery
      if (!this.tokenApplied() || this.model().discountType !== 'FreeDelivery') {
        this.model.update(m => ({ ...m, deliveryCharge: charge }));
      }
    });
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
    const deliveryCharge = o.deliveryCharge || 60;
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

    // Load order items
    if (this.selectedOrder.orderItems?.length) {
      this.orderItems.set([...this.selectedOrder.orderItems]);
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
      deliveryCharge: 60,
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
      error: () => {
        this.tokenError.set('Failed to validate token');
      }
    });
  }

  removeToken() {
    const district = this.form.shippingAddress.district().value().toLowerCase();
    const charge = district.includes('dhaka') ? 60 : 120;

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
    const existing = this.orderItems().find(i => i.productId === product.id);
    if (existing) {
      this.orderItems.update(items =>
        items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      );
    } else {
      const item: OrderItemM = {
        productId: product.id!,
        productName: product.title,
        quantity: 1,
        price: product.offerPrice || product.regularPrice || 0,
        image: product.image || ''
      };
      this.orderItems.update(items => [...items, item]);
    }
    this.productSearch.set('');
    this.showProductDropdown.set(false);
  }

  removeItem(productId: number) {
    this.orderItems.update(items => items.filter(i => i.productId !== productId));
  }

  updateItemQuantity(productId: number, qty: number) {
    if (qty < 1) return;
    this.orderItems.update(items =>
      items.map(i => i.productId === productId ? { ...i, quantity: qty } : i)
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
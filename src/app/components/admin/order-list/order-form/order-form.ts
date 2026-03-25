// order-form.component.ts
import { Component, EventEmitter, Input, Output, signal, computed, effect, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormField, form, required, validate, debounce } from '@angular/forms/signals';
import { OrderM } from '../../../../models/OrderM';
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
  imports: [CommonModule, FormField, BdtPipe],
  templateUrl: './order-form.html',
  styleUrl: './order-form.css',
})
export class OrderForm implements OnChanges {
  @Input() selectedOrder: OrderM | null = null;
  @Input() modalTitle: string = 'Order Form';
  @Input() isSubmitted = false;

  @Output() submitForm = new EventEmitter<Partial<OrderM>>();
  @Output() cancel = new EventEmitter<void>();

  /* ---------------- FORM MODEL ---------------- */
  model = signal<OrderFormModel>({
    companyID: environment.companyCode,
    userId: '',
    userEmail: '',
    userName: '',
    userPhone: '',
    subtotal: 0,
    deliveryCharge: 60,
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
    required(s.userEmail, { message: 'Email is required' });
    required(s.userPhone, { message: 'Phone is required' });

    validate(s.userEmail, ({ value }) => {
      const v = value();
      if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        return { kind: 'invalid', message: 'Please enter a valid email address' };
      }
      return null;
    });

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
    return (m.subtotal || 0) + (m.deliveryCharge || 0);
  });

  /* ---------------- EFFECTS ---------------- */
  constructor() {
    effect(() => {
      const total = this.totalAmount();
      this.model.update(m => ({ ...m, totalAmount: total }));
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

    this.model.set({
      companyID: this.selectedOrder.companyID || environment.companyCode,
      userId: this.selectedOrder.userId || '',
      userEmail: this.selectedOrder.userEmail || '',
      userName: this.selectedOrder.userName || '',
      userPhone: this.selectedOrder.userPhone || '',
      subtotal: this.selectedOrder.subtotal || 0,
      deliveryCharge: this.selectedOrder.deliveryCharge || 60,
      totalAmount: this.selectedOrder.totalAmount || 0,
      paymentMethod: this.selectedOrder.paymentMethod || 'CashOnDelivery',
      orderStatus: this.selectedOrder.orderStatus || 'Pending',
      orderDate: this.selectedOrder.orderDate || new Date().toISOString(),
      shippingAddress: {
        district: this.selectedOrder.shippingAddress?.district || '',
        city: this.selectedOrder.shippingAddress?.city || '',
        street: this.selectedOrder.shippingAddress?.street || '',
        contact: this.selectedOrder.shippingAddress?.contact || '',
        type: this.selectedOrder.shippingAddress?.type || 'Home'
      }
    });

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
      orderItems: this.selectedOrder?.orderItems || [],
      discountToken: this.selectedOrder?.discountToken,
      discountType: this.selectedOrder?.discountType,
      discountValue: this.selectedOrder?.discountValue,
      discountAmount: this.selectedOrder?.discountAmount,
    };

    this.submitForm.emit(orderData);
  }

  onCancel() {
    this.cancel.emit();
  }
}
// order-form.component.ts
import { Component, EventEmitter, inject, Input, Output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormField, form, required, validate, debounce } from '@angular/forms/signals';
import { OrderM } from '../../../../models/OrderM';
import { environment } from '../../../../../environments/environment';
import { BdtPipe } from '../../../../pipes/bdt.pipe';

@Component({
  selector: 'app-order-form',
  imports: [CommonModule, FormField, BdtPipe],
  templateUrl: './order-form.html',
  styleUrl: './order-form.css',
})
export class OrderForm {
  @Input() selectedOrder: OrderM | null = null;
  @Input() modalTitle: string = 'Order Form';
  @Input() isSubmitted = false;

  @Output() submitForm = new EventEmitter<Partial<OrderM>>();
  @Output() cancel = new EventEmitter<void>();

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
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
    companyID: environment.companyCode,
    shippingAddress: {
      district: '',
      city: '',
      street: '',
      contact: '',
      type: 'Home'
    }
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    // Customer Information
    required(schemaPath.userName, { message: 'Customer name is required' });
    required(schemaPath.userEmail, { message: 'Email is required' });
    required(schemaPath.userPhone, { message: 'Phone is required' });
    
    // Email validation
    validate(schemaPath.userEmail, ({ value }) => {
      if (value() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value())) {
        return {
          kind: 'invalid',
          message: 'Please enter a valid email address'
        };
      }
      return null;
    });

    // Payment method
    required(schemaPath.paymentMethod, { message: 'Payment method is required' });
    
    // Shipping address validations
    required(schemaPath.shippingAddress.district, { message: 'District is required' });
    required(schemaPath.shippingAddress.city, { message: 'City is required' });
    required(schemaPath.shippingAddress.street, { message: 'Street is required' });
    required(schemaPath.shippingAddress.contact, { message: 'Contact number is required' });

    // Debounce for performance
    debounce(schemaPath.userName, 300);
    debounce(schemaPath.userEmail, 300);
  });

  statusOptions = [
    { label: 'Pending', value: 'Pending' },
    { label: 'Processing', value: 'Processing' },
    { label: 'Shipped', value: 'Shipped' },
    { label: 'Delivered', value: 'Delivered' },
    { label: 'Cancelled', value: 'Cancelled' }
  ];

  paymentMethods = [
    { label: 'Cash on Delivery', value: 'CashOnDelivery' },
    { label: 'Online Payment', value: 'OnlinePayment' }
  ];

  /* ---------------- COMPUTED VALUES ---------------- */
  totalAmount = computed(() => {
    const currentValue = this.model();
    const subtotal = currentValue.subtotal || 0;
    const deliveryCharge = currentValue.deliveryCharge || 0;
    return subtotal + deliveryCharge;
  });

  /* ---------------- EFFECTS ---------------- */
  constructor() {
    // Update total amount when subtotal or delivery charge changes
    effect(() => {
      const total = this.totalAmount();
      this.model.update(m => ({ ...m, totalAmount: total }));
    });
  }

  /* ---------------- LIFECYCLE ---------------- */
  ngOnChanges() {
    if (this.selectedOrder) {
      this.model.set({
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
        companyID: this.selectedOrder.companyID || environment.companyCode,
        shippingAddress: {
          district: this.selectedOrder.shippingAddress?.district || '',
          city: this.selectedOrder.shippingAddress?.city || '',
          street: this.selectedOrder.shippingAddress?.street || '',
          contact: this.selectedOrder.shippingAddress?.contact || '',
          type: this.selectedOrder.shippingAddress?.type || 'Home'
        }
      });
    }
  }

  /* ---------------- FORM FIELD ACCESSORS ---------------- */
  
  // Get field state - returns the field signal
  getField(fieldName: string) {
    return (this.form() as any)[fieldName];
  }

  // Get shipping address field state
  getShippingField(fieldName: string) {
    const shippingAddressField = (this.form() as any).get?.('shippingAddress');
    return shippingAddressField ? shippingAddressField[fieldName] : undefined;
  }

  // Check if field is invalid
  isFieldInvalid(fieldName: string): boolean {
    const field = this.getField(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  // Check if shipping field is invalid
  isShippingFieldInvalid(fieldName: string): boolean {
    const field = this.getShippingField(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  // Get field errors
  getFieldErrors(fieldName: string): any[] {
    const field = this.getField(fieldName);
    return field?.errors || [];
  }

  // Get shipping field errors
  getShippingFieldErrors(fieldName: string): any[] {
    const field = this.getShippingField(fieldName);
    return field?.errors || [];
  }

  // Mark field as touched
  markFieldTouched(fieldName: string) {
    const field = this.getField(fieldName);
    if (field && typeof field.markAsTouched === 'function') {
      field.markAsTouched();
    }
  }

  // Mark shipping field as touched
  markShippingFieldTouched(fieldName: string) {
    const field = this.getShippingField(fieldName);
    if (field && typeof field.markAsTouched === 'function') {
      field.markAsTouched();
    }
  }

  // Mark all fields as touched
  markAllFieldsTouched() {
    // Mark main fields
    ['userName', 'userEmail', 'userPhone', 'paymentMethod'].forEach(field => 
      this.markFieldTouched(field)
    );
    
    // Mark shipping fields
    ['district', 'city', 'street', 'contact'].forEach(field => 
      this.markShippingFieldTouched(field)
    );
  }

  // Check if form is valid
  isFormValid(): boolean {
    return this.form().valid();
  }

  onSubmit(event: Event) {
    event.preventDefault();

    if (!this.isFormValid()) {
      this.markAllFieldsTouched();
      return;
    }

    const formValue = this.model();
    
    const orderData: Partial<OrderM> = {
      ...formValue,
      totalAmount: this.totalAmount(),
      id: this.selectedOrder?.id
    };

    this.submitForm.emit(orderData);
  }

  onCancel() {
    this.cancel.emit();
  }
}
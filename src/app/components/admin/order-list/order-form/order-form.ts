import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Field } from '../../../shared/field/field';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-order-form',
  imports: [Field, ReactiveFormsModule],
  templateUrl: './order-form.html',
  styleUrl: './order-form.css',
})
export class OrderForm {
  @Input() selectedOrder: any = null;
  @Input() modalTitle: string = 'Order Form';

  @Output() submitForm = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  fb = inject(NonNullableFormBuilder);
  isSubmitted = false;

  statusOptions = [
    { label: 'Pending', value: 0 },
    { label: 'Processing', value: 1 },
    { label: 'Shipped', value: 2 },
    { label: 'Delivered', value: 3 },
    { label: 'Cancelled', value: 4 }
  ];

  paymentMethods = [
    { label: 'Cash on Delivery', value: 'CashOnDelivery' },
    { label: 'Online Payment', value: 'OnlinePayment' }
  ];

  form = this.fb.group({
    userName: ['', [Validators.required]],
    userEmail: ['', [Validators.required, Validators.email]],
    userPhone: ['', [Validators.required]],
    orderStatus: [0, [Validators.required]],
    paymentMethod: ['', [Validators.required]],
    shippingAddress: this.fb.group({
      district: ['', [Validators.required]],
      city: ['', [Validators.required]],
      street: ['', [Validators.required]],
      contact: ['', [Validators.required]]
    })
  });

  // Getter for shippingAddress FormGroup
  get shippingAddress(): FormGroup {
    return this.form.get('shippingAddress') as FormGroup;
  }

  ngOnChanges() {
    // console.log('selectedOrder', this.selectedOrder);
    if (this.selectedOrder) {
      this.form.patchValue({
        userName: this.selectedOrder.userName,
        userEmail: this.selectedOrder.userEmail,
        userPhone: this.selectedOrder.userPhone,
        orderStatus: this.selectedOrder.orderStatus,
        paymentMethod: this.selectedOrder.paymentMethod,
        shippingAddress: {
          district: this.selectedOrder.shippingAddress?.district || '',
          city: this.selectedOrder.shippingAddress?.city || '',
          street: this.selectedOrder.shippingAddress?.street || '',
          contact: this.selectedOrder.shippingAddress?.contact || ''
        }
      });
      // console.log('Form patched with selectedOrder data:', this.form.value);
    }
  }

  getControl(controlName: string): FormControl {
    return this.form.get(controlName) as FormControl;
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.isSubmitted = true;

    if (this.form.valid) {
      const formValue = this.form.value;
      const orderData = {
        ...formValue,
        id: this.selectedOrder?.Id || null,
        shippingAddress: {
          ...formValue.shippingAddress,
          OrderId: this.selectedOrder?.Id || null
        }
      };
      this.submitForm.emit(orderData);
    }
  }

  onCancel() {
    this.cancel.emit();
  }

}

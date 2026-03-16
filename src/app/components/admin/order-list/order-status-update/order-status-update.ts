// order-status-update.component.ts
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrderM } from '../../../../models/OrderM';

@Component({
  selector: 'app-order-status-update',
  imports: [FormsModule],
  templateUrl: './order-status-update.html',
  styleUrl: './order-status-update.css',
})
export class OrderStatusUpdate {
  @Input() currentStatus!: string;
  @Input() order!: OrderM;
  @Output() statusUpdated = new EventEmitter<{ id: number; status: string }>();

  newStatus = signal<string>('');
  showModal = false;

  statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Processing', label: 'Processing' },
    { value: 'Shipped', label: 'Shipped' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  openModal() {
    this.newStatus.set(this.currentStatus);
    this.showModal = true;
  }

  updateStatus() {
    if (this.newStatus() && this.newStatus() !== this.currentStatus) {
      this.statusUpdated.emit({ 
        ...this.order,
        id: this.order.id!, 
        status: this.newStatus()
      });
    }
    this.closeModal(); // Call closeModal instead of just setting showModal to false
  }

  closeModal() {
    this.showModal = false;
  }
}
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-order-status-update',
  imports: [FormsModule],
  templateUrl: './order-status-update.html',
  styleUrl: './order-status-update.css',
})
export class OrderStatusUpdate {
  @Input() currentStatus!: any;
  @Input() order!: any;
  @Output() statusUpdated = new EventEmitter<any>();

  newStatus: any = signal(this.currentStatus);
  showModal = false;

  statusOptions = [
    { value: 0, label: 'Pending' },
    { value: 1, label: 'Processing' },
    { value: 2, label: 'Shipped' },
    { value: 3, label: 'Delivered' },
    { value: 4, label: 'Cancelled' }
  ];

  openModal() {
    this.newStatus.set(this.currentStatus);
    this.showModal = true;
  }

  updateStatus() {
    this.statusUpdated.emit({ id: this.order.id, status: this.newStatus() });
    this.showModal = false;
  }

  // getStatusLabel(status: any): string {
  //   console.log(status, this.statusOptions);
  //   return this.statusOptions.find(opt => opt.value === status)?.label || '';
  // }

}

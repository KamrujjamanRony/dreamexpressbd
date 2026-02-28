import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-order-list-filter',
  imports: [FormsModule],
  templateUrl: './order-list-filter.html',
  styleUrl: './order-list-filter.css',
})
export class OrderListFilter {
  @Output() filterChanged = new EventEmitter<any>();
  today = new Date();

  statusFilter: any = null;
  fromDate: string = this.today.toISOString().split('T')[0]; // Default to today
  toDate: string = this.today.toISOString().split('T')[0]; // Default to

  statusOptions = [
    { value: null, label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  applyFilters() {
    this.filterChanged.emit({
      status: this.statusFilter,
      fromDate: this.fromDate,
      toDate: this.toDate
    });
  }

  resetFilters() {
    this.statusFilter = null;
    this.fromDate = '';
    this.toDate = '';
    this.applyFilters();
  }

}

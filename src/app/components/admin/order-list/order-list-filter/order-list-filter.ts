// order-list-filter.component.ts
import { Component, computed, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { STheme } from '../../../../utils/theme-toggle/s-theme';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-order-list-filter',
  imports: [FormsModule],
  templateUrl: './order-list-filter.html',
  styleUrl: './order-list-filter.css',
})
export class OrderListFilter {
  private themeService = inject(STheme);
  private themeSubscription?: Subscription;
  fromDate = input<string>('');
  toDate = input<string>('');
  @Output() filterChanged = new EventEmitter<any>();

  // Local signals for two-way binding
  localStatus = signal<string>('');
  localFromDate = signal<string>('');
  localToDate = signal<string>('');
  colorScheme = signal<string>('light');

  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Processing', label: 'Processing' },
    { value: 'Shipped', label: 'Shipped' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  ngOnInit() {
    // Initialize local values with inputs
    this.localFromDate.set(this.fromDate());
    this.localToDate.set(this.toDate());
    
    // Subscribe to theme changes
    this.themeSubscription = this.themeService.darkMode$.subscribe(isDark => {
      this.colorScheme.set(isDark ? 'dark' : 'light');
    });
  }

  // Update local values when inputs change
  ngOnChanges() {
    this.localFromDate.set(this.fromDate());
    this.localToDate.set(this.toDate());
  }

  ngOnDestroy() {
    // Clean up subscription to prevent memory leaks
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  applyFilters() {
    this.filterChanged.emit({
      status: this.localStatus(),
      fromDate: this.localFromDate(),
      toDate: this.localToDate()
    });
  }

  resetFilters() {
    this.localStatus.set('');
    this.localFromDate.set('');
    this.localToDate.set('');
    this.filterChanged.emit({
      status: '',
      fromDate: '',
      toDate: ''
    });
  }
}
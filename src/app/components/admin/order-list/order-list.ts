// order-list.component.ts
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faEye, faPencil, faTrash, faSearch, 
  faFilter, faDownload, faSync, faCheckCircle,
  faTimesCircle, faTruck, faClock
} from '@fortawesome/free-solid-svg-icons';
import { DatePipe } from '@angular/common';
import { OrderForm } from './order-form/order-form';
import { BdtPipe } from '../../../pipes/bdt.pipe';
import { SOrder } from '../../../services/s-order';
import { SToast } from '../../../utils/toast/toast.service';
import { SConfirm } from '../../../utils/confirm/confirm.service';
import { SPermission } from '../../../services/s-permission';
import { OrderM } from '../../../models/OrderM';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, OrderForm, BdtPipe, DatePipe],
  templateUrl: './order-list.html',
  styleUrls: ['./order-list.css']
})
export class OrderList implements OnInit {
  faEye = faEye;
  faPencil = faPencil;
  faTrash = faTrash;
  faSearch = faSearch;
  faFilter = faFilter;
  faDownload = faDownload;
  faSync = faSync;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faTruck = faTruck;
  faClock = faClock;

  private orderService = inject(SOrder);
  private toast = inject(SToast);
  private confirm = inject(SConfirm);
  private permissionService = inject(SPermission);

  // State
  orders = signal<OrderM[]>([]);
  isLoading = signal(false);
  hasError = signal(false);
  showForm = signal(false);
  selectedOrder = signal<OrderM | null>(null);
  isSubmitted = signal(false);
  searchQuery = signal('');
  selectedStatus = signal<string>('');
  dateFrom = signal<string>('');
  dateTo = signal<string>('');

  // Permissions
  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);

  // Computed filtered orders
  filteredOrders = computed(() => {
    let result = this.orders();
    
    // Filter by search query
    const query = this.searchQuery().toLowerCase();
    if (query) {
      result = result.filter(order => 
        order.userName?.toLowerCase().includes(query) ||
        order.userEmail?.toLowerCase().includes(query) ||
        order.userPhone?.includes(query) ||
        order.id?.toString().includes(query)
      );
    }
    
    // Filter by status
    if (this.selectedStatus()) {
      result = result.filter(order => order.orderStatus === this.selectedStatus());
    }
    
    // Filter by date range
    if (this.dateFrom()) {
      result = result.filter(order => order.orderDate >= this.dateFrom());
    }
    if (this.dateTo()) {
      result = result.filter(order => order.orderDate <= this.dateTo());
    }
    
    // Sort by date (newest first)
    return result.sort((a, b) => 
      new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );
  });

  // Statistics
  totalOrders = computed(() => this.filteredOrders().length);
  totalRevenue = computed(() => 
    this.filteredOrders().reduce((sum, order) => sum + (order.totalAmount || 0), 0)
  );
  pendingOrders = computed(() => 
    this.filteredOrders().filter(o => o.orderStatus === 'Pending').length
  );
  deliveredOrders = computed(() => 
    this.filteredOrders().filter(o => o.orderStatus === 'Delivered').length
  );

  statusOptions = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Processing', value: 'Processing' },
    { label: 'Shipped', value: 'Shipped' },
    { label: 'Delivered', value: 'Delivered' },
    { label: 'Cancelled', value: 'Cancelled' }
  ];

  statusColors: { [key: string]: string } = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Processing': 'bg-blue-100 text-blue-800',
    'Shipped': 'bg-purple-100 text-purple-800',
    'Delivered': 'bg-green-100 text-green-800',
    'Cancelled': 'bg-red-100 text-red-800'
  };

  ngOnInit() {
    this.loadPermissions();
    this.loadOrders();
  }

  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('Order', 'view'));
    this.isInsert.set(this.permissionService.hasPermission('Order', 'create'));
    this.isEdit.set(this.permissionService.hasPermission('Order', 'edit'));
    this.isDelete.set(this.permissionService.hasPermission('Order', 'delete'));
  }

  loadOrders() {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.orderService.search(
      this.dateFrom(),
      this.dateTo(),
      this.selectedStatus()
    ).subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.hasError.set(true);
        this.isLoading.set(false);
        this.toast.danger('Failed to load orders', 'bottom-right', 3000);
      }
    });
  }

  refreshOrders() {
    this.loadOrders();
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onStatusFilter(event: Event) {
    this.selectedStatus.set((event.target as HTMLSelectElement).value);
    this.loadOrders();
  }

  onDateFromChange(event: Event) {
    this.dateFrom.set((event.target as HTMLInputElement).value);
    this.loadOrders();
  }

  onDateToChange(event: Event) {
    this.dateTo.set((event.target as HTMLInputElement).value);
    this.loadOrders();
  }

  resetFilters() {
    this.searchQuery.set('');
    this.selectedStatus.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.loadOrders();
  }

  addOrder() {
    this.selectedOrder.set(null);
    this.showForm.set(true);
  }

  editOrder(order: OrderM) {
    this.selectedOrder.set(order);
    this.showForm.set(true);
  }

  viewOrder(order: OrderM) {
    // Implement view order details modal
    console.log('View order:', order);
  }

  async deleteOrder(order: OrderM) {
    const confirmed = await this.confirm.confirm({
      message: `Are you sure you want to delete order #${order.id}?`,
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (confirmed) {
      this.orderService.delete(order.id!).subscribe({
        next: () => {
          this.orders.update(orders => orders.filter(o => o.id !== order.id));
          this.toast.success('Order deleted successfully!', 'bottom-right', 3000);
        },
        error: (error) => {
          console.error('Error deleting order:', error);
          this.toast.danger('Failed to delete order', 'bottom-right', 3000);
        }
      });
    }
  }

  updateOrderStatus(order: OrderM, newStatus: string) {
    this.orderService.update(order.id!, { orderStatus: newStatus }).subscribe({
      next: (updatedOrder) => {
        this.orders.update(orders => 
          orders.map(o => o.id === order.id ? updatedOrder : o)
        );
        this.toast.success(`Order status updated to ${newStatus}`, 'bottom-right', 3000);
      },
      error: (error) => {
        console.error('Error updating order status:', error);
        this.toast.danger('Failed to update order status', 'bottom-right', 3000);
      }
    });
  }

  onFormSubmit(orderData: Partial<OrderM>) {
    this.isSubmitted.set(true);

    const request$ = orderData.id
      ? this.orderService.update(orderData.id, orderData)
      : this.orderService.add(orderData as OrderM);

    request$.subscribe({
      next: (savedOrder) => {
        if (orderData.id) {
          // Update existing order
          this.orders.update(orders => 
            orders.map(o => o.id === savedOrder.id ? savedOrder : o)
          );
          this.toast.success('Order updated successfully!', 'bottom-right', 3000);
        } else {
          // Add new order
          this.orders.update(orders => [savedOrder, ...orders]);
          this.toast.success('Order created successfully!', 'bottom-right', 3000);
        }
        this.showForm.set(false);
        this.isSubmitted.set(false);
      },
      error: (error) => {
        console.error('Error saving order:', error);
        this.toast.danger(
          error?.error?.message || 'Failed to save order', 
          'bottom-right', 
          3000
        );
        this.isSubmitted.set(false);
      }
    });
  }

  onFormCancel() {
    this.showForm.set(false);
    this.selectedOrder.set(null);
  }

  getStatusColor(status: string): string {
    return this.statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  // Export to CSV
  exportToCSV() {
    const orders = this.filteredOrders();
    const headers = ['Order ID', 'Customer Name', 'Email', 'Phone', 'Total', 'Status', 'Date'];
    const csvData = orders.map(order => [
      order.id,
      order.userName,
      order.userEmail,
      order.userPhone,
      order.totalAmount,
      order.orderStatus,
      new Date(order.orderDate).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
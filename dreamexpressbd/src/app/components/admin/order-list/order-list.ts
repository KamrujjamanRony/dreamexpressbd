// order-list.component.ts
import { CommonModule, DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faRemove, faPencil, faEye, faPlus } from '@fortawesome/free-solid-svg-icons';
import { BdtPipe } from '../../../pipes/bdt.pipe';
import { OrderListFilter } from './order-list-filter/order-list-filter';
import { OrderStatusUpdate } from './order-status-update/order-status-update';
import { OrderForm } from './order-form/order-form';
import { OrderDetails } from './order-details/order-details';
import { SOrder } from '../../../services/s-order';
import { SAuth } from '../../../services/s-auth';
import { OrderM } from '../../../models/OrderM';
import { SToast } from '../../../utils/toast/toast.service';
import { SConfirm } from '../../../utils/confirm/confirm.service';

@Component({
  selector: 'app-order-list',
  imports: [
    CommonModule,
    FormsModule,
    OrderListFilter,
    OrderStatusUpdate,
    BdtPipe,
    OrderForm,
    FontAwesomeModule,
    OrderDetails,
    NgOptimizedImage
  ],
  templateUrl: './order-list.html',
  styleUrl: './order-list.css',
  providers: [DatePipe],
})
export class OrderList {
  faRemove = faRemove;
  faPencil = faPencil;
  faEye = faEye;
  faPlus = faPlus;

  private orderService = inject(SOrder);
  private authService = inject(SAuth);
  private toast = inject(SToast);
  private confirm = inject(SConfirm);
  private datePipe = inject(DatePipe);

  /* ---------------- SIGNAL STATE ---------------- */
  orders = signal<OrderM[]>([]);
  filteredOrders = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.orders();

    return this.orders().filter(order =>
      order.id?.toString().includes(query) ||
      order.userName?.toLowerCase().includes(query) ||
      order.userEmail?.toLowerCase().includes(query) ||
      order.userPhone?.includes(query)
    );
  });
  fromDate = signal<string>('');
  toDate = signal<string>('');

  resetFilters() {
    const today = new Date();
    const formattedDate = this.datePipe.transform(today, 'yyyy-MM-dd') || '';

    this.fromDate.set(formattedDate);
    this.toDate.set(formattedDate);

    // Load orders with today's date
    this.loadOrders({
      status: '',
      fromDate: formattedDate,
      toDate: formattedDate
    });
  }

  selectedOrder = signal<OrderM | null>(null);
  searchQuery = signal('');

  isLoading = signal(false);
  hasError = signal(false);
  isSubmitted = signal(false);

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);

  showModal = false;
  viewMode: 'details' | 'form' = 'details';
  modalTitle = 'Order Details';

  statusOptions = [
    { value: 0, label: 'Pending' },
    { value: 1, label: 'Processing' },
    { value: 2, label: 'Shipped' },
    { value: 3, label: 'Delivered' },
    { value: 4, label: 'Cancelled' }
  ];

  ngOnInit(): void {
    this.loadPermissions();
    this.resetFilters();
  }

  loadPermissions() {
    this.isView.set(this.checkPermission("Orders", "View"));
    this.isInsert.set(this.checkPermission("Orders", "Insert"));
    this.isEdit.set(this.checkPermission("Orders", "Edit"));
    this.isDelete.set(this.checkPermission("Orders", "Delete"));
  }

  loadOrders(filters: any = {}): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    // Update the signals with new filter values if provided
    if (filters.fromDate !== undefined) {
      this.fromDate.set(filters.fromDate);
    }
    if (filters.toDate !== undefined) {
      this.toDate.set(filters.toDate);
    }

    // Get the current values (either from filters or existing signals)
    const fromDateStr = filters.fromDate !== undefined ? filters.fromDate : this.fromDate();
    const toDateStr = filters.toDate !== undefined ? filters.toDate : this.toDate();

    // Convert to Date objects only if the string is not empty
    let from = '';
    let to = '';

    if (fromDateStr) {
      const fromDate = new Date(fromDateStr);
      // Check if date is valid
      if (!isNaN(fromDate.getTime())) {
        from = this.datePipe.transform(fromDate, 'yyyy-MM-dd') || '';
      }
    }

    if (toDateStr) {
      const toDate = new Date(toDateStr);
      // Check if date is valid
      if (!isNaN(toDate.getTime())) {
        to = this.datePipe.transform(toDate, 'yyyy-MM-dd') || '';
      }
    }

    this.orderService.search(from, to, filters.status).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.hasError.set(true);
        this.isLoading.set(false);
        this.toast.danger('Failed to load orders', 'bottom-right', 5000);
        console.error('Error loading orders:', err);
      }
    });
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value.trim());
  }

  onStatusUpdated(updateData: { id: number; status: string }): void {
    const order = this.orders().find(o => o.id === updateData.id);
    if (!order) return;

    const updateRequest: Partial<OrderM> = {
      orderStatus: updateData.status
    };

    this.orderService.update(updateData.id, updateRequest).subscribe({
      next: (updatedOrder) => {
        this.orders.update(orders =>
          orders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
        );
        this.toast.success('Order status updated successfully!', 'bottom-right', 5000);
      },
      error: (err) => {
        console.error('Error updating order status:', err);
        this.toast.danger('Failed to update order status', 'bottom-left', 5000);
      }
    });
  }

  openAddModal() {
    this.modalTitle = 'Add New Order';
    this.viewMode = 'form';
    this.selectedOrder.set(null);
    this.showModal = true;
  }

  viewOrderDetails(order: OrderM) {
    this.modalTitle = 'Order Details';
    this.viewMode = 'details';
    this.selectedOrder.set(order);
    this.showModal = true;
  }

  openEditModal(order: OrderM) {
    this.modalTitle = 'Edit Order';
    this.viewMode = 'form';
    this.selectedOrder.set(order);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedOrder.set(null);
  }

  handleFormSubmit(formData: Partial<OrderM>) {
    this.isSubmitted.set(true);

    const request$ = this.selectedOrder()
      ? this.orderService.update(this.selectedOrder()!.id!, formData)
      : this.orderService.add(formData as OrderM);

    request$.subscribe({
      next: (response) => {
        this.loadOrders();
        this.closeModal();
        this.toast.success(
          this.selectedOrder() ? 'Order updated successfully!' : 'Order created successfully!',
          'bottom-right',
          5000
        );
        this.isSubmitted.set(false);
      },
      error: (err) => {
        this.isSubmitted.set(false);
        console.error('Error saving order:', err);
        this.toast.danger(
          err.error?.message || 'Failed to save order',
          'bottom-left',
          5000
        );
      }
    });
  }

  async onDelete(order: OrderM) {
    const confirmed = await this.confirm.confirm({
      message: `Are you sure you want to delete order #${order.id}?`,
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (confirmed) {
      this.orderService.delete(order.id).subscribe({
        next: () => {
          this.orders.update(orders => orders.filter(o => o.id !== order.id));
          this.toast.success('Order deleted successfully!', 'bottom-right', 5000);
        },
        error: (err) => {
          console.error('Error deleting order:', err);
          this.toast.danger('Failed to delete order', 'bottom-left', 5000);
        }
      });
    }
  }

  checkPermission(moduleName: string, permission: string): boolean {
    const modulePermission = this.authService.getUser()?.userMenu?.find(
      (module: any) => module?.menuName?.toLowerCase() === moduleName.toLowerCase()
    );
    return modulePermission?.permissions?.some(
      (perm: any) => perm.toLowerCase() === permission.toLowerCase()
    ) || false;
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Processing': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Shipped': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Delivered': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}
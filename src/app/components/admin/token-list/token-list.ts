import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass, faPlus } from '@fortawesome/free-solid-svg-icons';
import { SToken } from '../../../services/s-token';
import { SPermission } from '../../../services/s-permission';
import { SToast } from '../../../utils/toast/toast.service';
import { SConfirm } from '../../../utils/confirm/confirm.service';
import { TokenM } from '../../../models/TokenM';

@Component({
  selector: 'app-token-list',
  imports: [CommonModule, FormsModule, FontAwesomeModule, DatePipe],
  templateUrl: './token-list.html',
  styleUrl: './token-list.css',
})
export class TokenList {
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;
  faPlus = faPlus;

  private tokenService = inject(SToken);
  private permissionService = inject(SPermission);
  private toast = inject(SToast);
  private confirm = inject(SConfirm);

  items = signal<TokenM[]>([]);
  searchQuery = signal('');
  isLoading = signal(false);
  hasError = signal(false);
  showForm = signal(false);
  selected = signal<TokenM | null>(null);
  isSubmitted = signal(false);

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);

  // Form fields
  formData = {
    code: '',
    type: 'Percentage',
    value: 0,
    maxUseCount: 1,
    expireAt: '',
    isActive: true
  };

  typeOptions = [
    { label: 'Percentage', value: 'Percentage' },
    { label: 'Fixed', value: 'Fixed' },
    { label: 'Free Delivery', value: 'FreeDelivery' }
  ];

  filteredList = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.items().filter(item =>
      item.code?.toLowerCase().includes(query) ||
      item.type?.toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    this.loadItems();
    this.loadPermissions();
  }

  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('DiscountToken', 'view'));
    this.isInsert.set(this.permissionService.hasPermission('DiscountToken', 'create'));
    this.isEdit.set(this.permissionService.hasPermission('DiscountToken', 'edit'));
    this.isDelete.set(this.permissionService.hasPermission('DiscountToken', 'delete'));
  }

  loadItems() {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.tokenService.search().subscribe({
      next: (data) => {
        this.items.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value.trim());
  }

  openForm(item?: TokenM) {
    if (item) {
      this.selected.set(item);
      this.formData = {
        code: item.code,
        type: item.type,
        value: item.value,
        maxUseCount: item.maxUseCount,
        expireAt: new Date(item.expireAt).toISOString().slice(0, 16),
        isActive: item.isActive
      };
    } else {
      this.selected.set(null);
      this.resetFormData();
    }
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.selected.set(null);
    this.isSubmitted.set(false);
    this.resetFormData();
  }

  resetFormData() {
    this.formData = {
      code: '',
      type: 'Percentage',
      value: 0,
      maxUseCount: 1,
      expireAt: '',
      isActive: true
    };
  }

  onSubmit() {
    if (!this.formData.code || !this.formData.expireAt) {
      this.toast.warning('Please fill all required fields', 'bottom-right', 3000);
      return;
    }

    this.isSubmitted.set(true);

    const payload: TokenM = {
      id: this.selected()?.id || 0,
      code: this.formData.code,
      type: this.formData.type,
      value: this.formData.value,
      maxUseCount: this.formData.maxUseCount,
      usedCount: this.selected()?.usedCount || 0,
      expireAt: new Date(this.formData.expireAt),
      isActive: this.formData.isActive
    };

    const request$ = this.selected()
      ? this.tokenService.update(this.selected()!.id, payload)
      : this.tokenService.add(payload);

    request$.subscribe({
      next: () => {
        this.loadItems();
        this.closeForm();
        this.toast.success('Token saved successfully!', 'bottom-right', 3000);
      },
      error: () => {
        this.isSubmitted.set(false);
        this.toast.danger('Failed to save token', 'bottom-right', 3000);
      }
    });
  }

  async onDelete(id: number) {
    const ok = await this.confirm.confirm({
      message: 'Are you sure you want to delete this token?',
      confirmText: "Yes, delete",
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (ok) {
      this.tokenService.delete(id).subscribe({
        next: () => {
          this.items.update(list => list.filter(i => i.id !== id));
          this.toast.success('Token deleted!', 'bottom-right', 3000);
        },
        error: () => {
          this.toast.danger('Failed to delete token', 'bottom-right', 3000);
        }
      });
    }
  }
}

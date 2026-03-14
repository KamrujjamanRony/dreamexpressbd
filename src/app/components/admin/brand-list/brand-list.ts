import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FormsModule } from '@angular/forms';
import { SBrand } from '../../../services/s-brand';
import { debounce, form, FormField, required, validate } from '@angular/forms/signals';
import { environment } from '../../../../environments/environment.production';
import { SPermission } from '../../../services/s-permission';
import { SToast } from '../../../utils/toast/toast.service';
import { SConfirm } from '../../../utils/confirm/confirm.service';
import { BrandM } from '../../../models/Brand';

@Component({
  selector: 'app-brand-list',
  imports: [CommonModule, FontAwesomeModule, FormField, FormsModule],
  templateUrl: './brand-list.html',
  styleUrl: './brand-list.css',
})
export class BrandList {
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;
  
  /* ---------------- DI ---------------- */
  private brandService = inject(SBrand);
  private permissionService = inject(SPermission);
  private toast = inject(SToast);
  private confirm = inject(SConfirm);
  
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  /* ---------------- SIGNAL STATE ---------------- */
  items = signal<BrandM[]>([]);
  searchQuery = signal('');

  filteredList = computed(() => {
    const query = this.searchQuery().toLowerCase();

    return this.items()
      .filter(item =>
        item.brandName?.toLowerCase().includes(query)
      )
      .sort((a, b) => (a.slBrand! - b.slBrand!));
  });

  selected = signal<BrandM | null>(null);

  isLoading = signal(false);
  hasError = signal(false);

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);
  showList = signal(true);

  isSubmitted = signal(false);

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    brandName: '',
    slBrand: '',
    companyID: environment.companyCode.toString(),
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.brandName, { message: 'Brand name is required' });
    validate(schemaPath.slBrand, ({ value }) => {
      if (value() && !/^\d+$/.test(value())) {
        return {
          kind: 'complexity',
          message: 'SL Brand must be a valid number'
        }
      }
      return null;
    })

    debounce(schemaPath.brandName, 300);
  });

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit(): void {
    this.loadItems();
    this.loadPermissions();
  }

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('Brand', 'view'));
    this.isInsert.set(this.permissionService.hasPermission('Brand', 'create'));
    this.isEdit.set(this.permissionService.hasPermission('Brand', 'edit'));
    this.isDelete.set(this.permissionService.hasPermission('Brand', 'delete'));
  }

  loadItems() {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.brandService.search().subscribe({
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

  /* ---------------- SEARCH ---------------- */
  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value.trim());
  }

  /* ---------------- SUBMIT ---------------- */
  onSubmit(event: Event) {
    event.preventDefault();

    if (!this.form().valid()) {
      this.toast.warning('Form is Invalid!', 'bottom-right', 5000);
      return;
    }

    this.isSubmitted.set(true);

    const formValue = this.form().value();

    const payload: BrandM = {
      companyID: Number(formValue.companyID),
      brandName: formValue.brandName,
      slBrand: formValue.slBrand ? Number(formValue.slBrand) : 0,
    };
    
    const request$ = this.selected()
      ? this.brandService.update(this.selected()!.id!, payload)
      : this.brandService.add(payload);

    request$.subscribe({
      next: () => {
        this.loadItems();
        this.onToggleList();
        this.toast.success('Saved successfully!', 'bottom-right', 5000);
      },
      error: (error) => {
        this.isSubmitted.set(false);
        console.error(error?.message || error?.error?.message || 'An error occurred during submission.');
        this.toast.danger('Saved unsuccessful!', 'bottom-left', 3000);
      }
    });
  }

  /* ---------------- UPDATE ---------------- */
  onUpdate(item: BrandM) {
    this.selected.set(item);

    // Update form model
    this.model.update(current => ({
      ...current,
      brandName: item.brandName ?? '',
      slBrand: item.slBrand?.toString() ?? '',
      companyID: item.companyID.toString(),
    }));

    this.form().reset();
    this.showList.set(false);
  }

  /* ---------------- DELETE ---------------- */
  async onDelete(id: any) {
    const ok = await this.confirm.confirm({
      message: 'Are you sure you want to delete this brand?',
      confirmText: "Yes, I'm sure",
      cancelText: 'No, cancel',
      variant: 'danger',
    });

    if (ok) {
      // Delete item
      this.brandService.delete(id).subscribe({
        next: () => {
          this.items.update(list => list.filter(i => i.id !== id));
          this.toast.success('Brand deleted successfully!', 'bottom-right', 5000);
        },
        error: (error) => {
          this.toast.danger('Brand deleted unsuccessful!', 'bottom-left', 3000);
          console.error('Error deleting brand:', error);
        }
      });
    }
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    this.model.set({
      brandName: '',
      slBrand: '',
      companyID: environment.companyCode.toString(),
    });

    this.selected.set(null);
    this.isSubmitted.set(false);
    this.form().reset();
  }

  onToggleList() {
    this.showList.update(s => !s);
    this.formReset();
  }

}

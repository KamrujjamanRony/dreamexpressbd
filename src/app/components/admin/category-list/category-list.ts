import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FormsModule } from '@angular/forms';
import { SCategory } from '../../../services/s-category';
import { debounce, form, FormField, required, validate } from '@angular/forms/signals';
import { environment } from '../../../../environments/environment';
import { SPermission } from '../../../services/s-permission';
import { SToast } from '../../../utils/toast/toast.service';
import { SConfirm } from '../../../utils/confirm/confirm.service';
import { CategoryM } from '../../../models/Category';
import { GalleryPicker } from '../../shared/gallery-picker/gallery-picker';

@Component({
  selector: 'app-category-list',
  imports: [CommonModule, FontAwesomeModule, FormField, FormsModule, GalleryPicker],
  templateUrl: './category-list.html',
  styleUrl: './category-list.css',
})
export class CategoryList {
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;

  /* ---------------- DI ---------------- */
  private categoryService = inject(SCategory);
  private permissionService = inject(SPermission);
  private toast = inject(SToast);
  private confirm = inject(SConfirm);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  imgURL = environment.ImageApi;
  emptyImg = environment.emptyImg;

  /* ---------------- SIGNAL STATE ---------------- */
  items = signal<CategoryM[]>([]);
  searchQuery = signal('');

  // Gallery selection
  selectedGalleryId = signal<string>('');
  selectedGalleryUrl = signal<string>('');

  filteredList = computed(() => {
    const query = this.searchQuery().toLowerCase();

    return this.items()
      .filter(item =>
        String(item.id ?? '').toLowerCase().includes(query) ||
        String(item.slItem ?? '').toLowerCase().includes(query) ||
        item.itemName?.toLowerCase().includes(query)
      )
      .sort((a, b) => (a.slItem! - b.slItem!));
  });

  selected = signal<CategoryM | null>(null);

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
    itemName: '',
    slItem: '',
    companyID: environment.companyCode.toString(),
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.itemName, { message: 'itemName is required' });
    validate(schemaPath.slItem, ({ value }) => {
      if (value() && !/^\d+$/.test(value())) {
        return {
          kind: 'complexity',
          message: 'SL Item must be a valid number'
        }
      }
      return null;
    })

    debounce(schemaPath.itemName, 300);
  });

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit(): void {
    this.loadItems();
    this.loadPermissions();
  }

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('Item', 'view'));
    this.isInsert.set(this.permissionService.hasPermission('Item', 'create'));
    this.isEdit.set(this.permissionService.hasPermission('Item', 'edit'));
    this.isDelete.set(this.permissionService.hasPermission('Item', 'delete'));
  }

  loadItems() {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.categoryService.search().subscribe({
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

  /* ---------------- GALLERY PICKER ---------------- */
  onGalleryPicked(event: { id: string; imageUrl: string }) {
    this.selectedGalleryId.set(event.id);
    this.selectedGalleryUrl.set(event.imageUrl);
  }

  clearGalleryImage() {
    this.selectedGalleryId.set('');
    this.selectedGalleryUrl.set('');
  }

  /* ---------------- SUBMIT ---------------- */
  onSubmit(event: Event) {
    event.preventDefault();

    if (!this.form().valid()) {
      this.toast.warning('Form is Invalid!');
      return;
    }

    this.isSubmitted.set(true);

    const formValue = this.form().value();

    const body = {
      companyID: +formValue.companyID,
      itemName: formValue.itemName,
      slItem: +formValue.slItem || 0,
      iGalleryId: this.selectedGalleryId() || '',
    };

    const request$ = this.selected()
      ? this.categoryService.update(this.selected()!.id!, body)
      : this.categoryService.add(body);

    request$.subscribe({
      next: () => {
        this.loadItems();
        this.onToggleList();
        this.toast.success('Saved successfully!');
      },
      error: (error) => {
        this.isSubmitted.set(false);
        console.error('Error:', error);
        this.toast.danger(error?.error || 'Save unsuccessful!');
      }
    });
  }

  /* ---------------- UPDATE ---------------- */
  onUpdate(item: CategoryM) {
    this.selected.set(item);

    // Update form model
    this.model.update(current => ({
      ...current,
      itemName: item.itemName ?? '',
      slItem: item.slItem?.toString() ?? '',
      companyID: item.companyID.toString(),
    }));

    // Set gallery image
    if (item.iGalleryId) {
      this.selectedGalleryId.set(item.iGalleryId);
      this.selectedGalleryUrl.set(item.imageUrl || '');
    }

    this.form().reset();
    this.showList.set(false);
  }

  /* ---------------- DELETE ---------------- */
  async onDelete(id: any) {
    const ok = await this.confirm.confirm({
      message: 'Are you sure you want to delete this item?',
      confirmText: "Yes, I'm sure",
      cancelText: 'No, cancel',
      variant: 'danger',
    });

    if (ok) {
      this.categoryService.delete(id).subscribe({
        next: () => {
          this.items.update(list => list.filter(i => i.id !== id));
          this.toast.success('Item deleted successfully!');
        },
        error: (error) => {
          this.toast.danger(error?.error || 'Item delete unsuccessful!');
          console.error('Error deleting item:', error);
        }
      });
    }
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    this.model.set({
      itemName: '',
      slItem: '',
      companyID: environment.companyCode.toString(),
    });

    this.selected.set(null);
    this.selectedGalleryId.set('');
    this.selectedGalleryUrl.set('');
    this.isSubmitted.set(false);
    this.showGalleryPicker.set(false);
    this.form().reset();
  }

  onToggleList() {
    this.showList.update(s => !s);
    this.formReset();
  }

}

// product-list.ts
import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { form, FormField } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { SPermission } from '../../../services/s-permission';
import { SToast } from '../../../utils/toast/toast.service';
import { SConfirm } from '../../../utils/confirm/confirm.service';
import { ProductColorM, ProductM } from '../../../models/Products';
import { BrandM } from '../../../models/Brand';
import { CategoryM } from '../../../models/Category';
import { SProduct } from '../../../services/s-product';
import { SBrand } from '../../../services/s-brand';
import { SCategory } from '../../../services/s-category';
import { SAuth } from '../../../services/s-auth';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { QuillEditorComponent } from 'ngx-quill';
import { GalleryPicker } from '../../shared/gallery-picker/gallery-picker';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, FontAwesomeModule, FormField, FormsModule, QuillEditorComponent, GalleryPicker],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.css'],
})
export class ProductList {
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;
  faTrash = faTrash;
  faPlus = faPlus;

  /* ---------------- DI ---------------- */
  private productService = inject(SProduct);
  private brandService = inject(SBrand);
  private categoryService = inject(SCategory);
  private permissionService = inject(SPermission);
  private auth = inject(SAuth);
  private toast = inject(SToast);
  private confirm = inject(SConfirm);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('categoryFilter') categoryFilter!: ElementRef<HTMLSelectElement>;
  @ViewChild('brandFilter') brandFilter!: ElementRef<HTMLSelectElement>;
  @ViewChild('statusFilter') statusFilter!: ElementRef<HTMLSelectElement>;

  imgURL = environment.ImageApi;
  emptyImg = environment.emptyImg;

  /* ---------------- SIGNAL STATE ---------------- */
  products = signal<ProductM[]>([]);
  brands = signal<BrandM[]>([]);
  categories = signal<CategoryM[]>([]);

  searchQuery = signal('');
  selectedCategory = signal<number | null>(null);
  selectedBrand = signal<string | null>(null);
  selectedStatus = signal<boolean | null>(null);

  activeTab = signal<'basic' | 'images' | 'colors' | 'related'>('basic');

  filteredList = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const categoryId = this.selectedCategory();
    const brand = this.selectedBrand()?.toLowerCase();
    const status = this.selectedStatus();

    return this.products()
      .filter(product => {
        // Search filter
        const matchesSearch = !query ||
          product.title?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.brand?.toLowerCase().includes(query) ||
          product.model?.toLowerCase().includes(query);

        // Category filter
        const matchesCategory = !categoryId || product.categoryId === categoryId;

        // Brand filter
        const matchesBrand = !brand || product.brand?.toLowerCase().includes(brand);

        // Status filter
        const matchesStatus = status === null || product.isActive === status;

        return matchesSearch && matchesCategory && matchesBrand && matchesStatus;
      })
      .reverse();
  });

  availableProducts = computed(() => {
    return this.products().filter(p => p.id !== this.selected()?.id);
  });

  selected = signal<ProductM | null>(null);

  /* Gallery — main image */
  selectedGalleryId = signal('');
  selectedGalleryUrl = signal('');

  /* Gallery — additional images */
  productImages = signal<{ id: string; url: string }[]>([]);
  addImageGalleryId = signal('');
  addImageGalleryUrl = signal('');

  colorsList = signal<ProductColorM[]>([]);

  relatedProductsList = signal<number[]>([]);
  relatedSearchQuery = signal('');
  filteredRelatedProducts = signal<ProductM[]>([]);
  isFilteringRelated = signal(false);

  isLoading = signal(false);
  hasError = signal(false);

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);

  isSubmitted = signal(false);
  showList = signal(true);

  /* ---------------- Rich Text Editor ---------------- */
  editorDescription = '';
  editorSpecialFeature = '';
  editorAdditionalInfo = '';

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'direction': 'rtl' }],
      ['clean']
    ]
  };

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    companyID: environment.companyCode,
    title: '',
    description: '',
    categoryId: '0',
    brand: '',
    model: '',
    origin: '',
    sku: '',
    sl: 0,
    sizes: '',
    regularPrice: 0,
    offerPrice: 0,
    additionalInformation: '',
    specialFeature: '',
    catalogURL: '',
    youtubeLink: '',
    facebookPost: '',
    others: '',
    isActive: true,
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model);

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit(): void {
    this.loadPermissions();
    this.loadBrands();
    this.loadCategories();
    this.loadProducts();
  }

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('Product', 'view'));
    this.isInsert.set(this.permissionService.hasPermission('Product', 'create'));
    this.isEdit.set(this.permissionService.hasPermission('Product', 'edit'));
    this.isDelete.set(this.permissionService.hasPermission('Product', 'delete'));
  }

  loadProducts() {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.productService.search().subscribe({
      next: (data) => {
        this.products.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  loadBrands() {
    this.brandService.search().subscribe({
      next: (data) => this.brands.set(data),
      error: (error) => console.error('Error loading brands:', error)
    });
  }

  loadCategories() {
    this.categoryService.search().subscribe({
      next: (data) => this.categories.set(data),
      error: (error) => console.error('Error loading categories:', error)
    });
  }

  /* ---------------- FILTERS ---------------- */
  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value.trim());
  }

  onFilterByCategory(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedCategory.set(value ? Number(value) : null);
  }

  onFilterByBrand(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedBrand.set(value || null);
  }

  onFilterByStatus(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedStatus.set(value ? value === 'true' : null);
  }

  resetFilters() {
    this.searchQuery.set('');
    this.selectedCategory.set(null);
    this.selectedBrand.set(null);
    this.selectedStatus.set(null);

    // Reset select elements
    if (this.categoryFilter) {
      this.categoryFilter.nativeElement.value = '';
    }
    if (this.brandFilter) {
      this.brandFilter.nativeElement.value = '';
    }
    if (this.statusFilter) {
      this.statusFilter.nativeElement.value = '';
    }
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
    }
  }

  /* ---------------- UTILITY ---------------- */
  getCategoryName(categoryId: number): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category?.categoryName || '-';
  }

  getProductTitle(productId: number): string {
    const product = this.products().find(p => p.id === productId);
    return product?.title || 'Unknown';
  }

  isProductRelated(productId: number): boolean {
    return this.relatedProductsList().includes(productId);
  }

  /* ---------------- GALLERY HANDLERS ---------------- */
  onMainImagePicked(event: { id: string; imageUrl: string }) {
    this.selectedGalleryId.set(event.id);
    this.selectedGalleryUrl.set(event.imageUrl);
  }

  clearMainImage() {
    this.selectedGalleryId.set('');
    this.selectedGalleryUrl.set('');
  }

  onAddProductImage(event: { id: string; imageUrl: string }) {
    this.productImages.update(imgs => [...imgs, { id: event.id, url: event.imageUrl }]);
    // Reset the add-image picker so it can pick another
    this.addImageGalleryId.set('');
    this.addImageGalleryUrl.set('');
  }

  clearAddImagePicker() {
    this.addImageGalleryId.set('');
    this.addImageGalleryUrl.set('');
  }

  removeProductImage(index: number) {
    this.productImages.update(imgs => imgs.filter((_, i) => i !== index));
  }

  onColorImagePicked(index: number, event: { id: string; imageUrl: string }) {
    this.colorsList.update(colors => {
      const updated = [...colors];
      updated[index] = { ...updated[index], id: event.id, resolvedUrl: event.imageUrl };
      return updated;
    });
  }

  clearColorImage(index: number) {
    this.colorsList.update(colors => {
      const updated = [...colors];
      updated[index] = { ...updated[index], id: '', resolvedUrl: '' };
      return updated;
    });
  }

  /* ---------------- COLORS MANAGEMENT ---------------- */
  addColor() {
    this.colorsList.update(prev => [...prev, { cn: '', id: '', resolvedUrl: '' }]);
  }

  removeColor(index: number) {
    this.colorsList.update(prev => prev.filter((_, i) => i !== index));
  }

  /* ---------------- RELATED PRODUCTS ---------------- */
  filterRelatedProducts() {
    const query = this.relatedSearchQuery().toLowerCase().trim();

    if (!query) {
      this.filteredRelatedProducts.set(this.availableProducts());
      return;
    }

    this.isFilteringRelated.set(true);

    // Simulate async filtering for better UX
    setTimeout(() => {
      const filtered = this.availableProducts().filter(product =>
        product.title?.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.model?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
      );
      this.filteredRelatedProducts.set(filtered);
      this.isFilteringRelated.set(false);
    }, 300);
  }
  toggleRelatedProduct(productId: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.relatedProductsList.update(prev => [...prev, productId]);
    } else {
      this.relatedProductsList.update(prev => prev.filter(id => id !== productId));
    }
  }

  removeRelatedProduct(productId: number) {
    this.relatedProductsList.update(prev => prev.filter(id => id !== productId));
  }

  /* ---------------- SUBMIT ---------------- */
  onSubmit(event: Event) {
    event.preventDefault();

    // Sync editor values to model before validation
    this.model.update(m => ({
      ...m,
      description: this.editorDescription,
      specialFeature: this.editorSpecialFeature,
      additionalInformation: this.editorAdditionalInfo,
    }));

    if (!this.form().valid()) {
      this.toast.warning('Please fill all required fields!', 'bottom-right', 5000);
      return;
    }

    const formValue = this.form().value();

    if (!formValue.categoryId || formValue.categoryId === '0') {
      this.toast.warning('Please select a category!', 'bottom-right', 5000);
      this.activeTab.set('basic');
      return;
    }

    if (!formValue.brand) {
      this.toast.warning('Please select a brand!', 'bottom-right', 5000);
      this.activeTab.set('basic');
      return;
    }

    if (!formValue.title) {
      this.toast.warning('Please enter a title!', 'bottom-right', 5000);
      this.activeTab.set('basic');
      return;
    }

    if (!formValue.regularPrice || formValue.regularPrice <= 0) {
      this.toast.warning('Please enter a valid regular price!', 'bottom-right', 5000);
      this.activeTab.set('basic');
      return;
    }

    if (!this.selected() && !this.selectedGalleryId()) {
      this.toast.warning('Please select a main image!', 'bottom-right', 5000);
      this.activeTab.set('images');
      return;
    }

    this.isSubmitted.set(true);

    const adminUser = this.auth.getUser();
    const body = {
      companyID: environment.companyCode,
      title: formValue.title,
      postBy: adminUser?.username || '',
      description: this.editorDescription,
      categoryId: Number(formValue.categoryId),
      brand: formValue.brand,
      model: formValue.model,
      origin: formValue.origin,
      additionalInformation: this.editorAdditionalInfo,
      specialFeature: this.editorSpecialFeature,
      catalogURL: formValue.catalogURL,
      sl: formValue.sl || 0,
      sku: formValue.sku,
      sizes: formValue.sizes,
      others: formValue.others,
      regularPrice: formValue.regularPrice,
      offerPrice: formValue.offerPrice,
      youtubeLink: formValue.youtubeLink,
      facebookPost: formValue.facebookPost,
      isActive: formValue.isActive ? 1 : 0,
      imageUrl: this.selectedGalleryId(),
      images: this.productImages().map(img => img.id),
      productColors: this.colorsList()
        .filter(c => c.cn)
        .map(c => ({ cn: c.cn, id: c.id })),
      relatedProducts: this.relatedProductsList(),
    };

    const request$ = this.selected()
      ? this.productService.update(this.selected()!.id, body)
      : this.productService.add(body);

    request$.subscribe({
      next: () => {
        this.loadProducts();
        this.onToggleList();
        this.toast.success('Product saved successfully!', 'bottom-right', 5000);
        this.isSubmitted.set(false);
      },
      error: (error) => {
        this.isSubmitted.set(false);
        console.error('Error:', error);
        this.toast.danger(
          error?.error || 'Save unsuccessful!',
          'bottom-left',
          3000
        );
      }
    });
  }

  /* ---------------- UPDATE ---------------- */
  onUpdate(product: ProductM) {
    this.selected.set(product);

    this.model.set({
      companyID: environment.companyCode,
      title: product.title,
      description: product.description || '',
      categoryId: String(product.categoryId || '0'),
      brand: product.brand || '',
      model: product.model || '',
      origin: product.origin || '',
      sku: product.sku || '',
      sl: product.sl || 0,
      sizes: product.sizes || '',
      regularPrice: product.regularPrice || 0,
      offerPrice: product.offerPrice || 0,
      additionalInformation: product.additionalInformation || '',
      specialFeature: product.specialFeature || '',
      catalogURL: product.catalogURL || '',
      youtubeLink: product.youtubeLink || '',
      facebookPost: product.facebookPost || '',
      others: product.others || '',
      isActive: product.isActive ?? true,
    });

    // Sync editor properties
    this.editorDescription = product.description || '';
    this.editorSpecialFeature = product.specialFeature || '';
    this.editorAdditionalInfo = product.additionalInformation || '';

    this.form().reset();

    // Initialize filtered related products
    this.filteredRelatedProducts.set(this.availableProducts());

    // Set related products
    if (product.relatedProducts) {
      this.relatedProductsList.set(product.relatedProducts);
    }

    // Set main image
    this.selectedGalleryId.set(product.imageUrl || '');
    this.selectedGalleryUrl.set(product.resolvedImageUrl || '');

    // Set additional images
    if (product.images?.length) {
      const imgs = product.images.map((id, i) => ({
        id,
        url: product.resolvedImages?.[i] || ''
      }));
      this.productImages.set(imgs);
    } else {
      this.productImages.set([]);
    }

    // Set colors
    if (product.productColors?.length) {
      this.colorsList.set(product.productColors.map(c => ({
        cn: c.cn,
        id: c.id,
        resolvedUrl: c.resolvedUrl || ''
      })));
    } else {
      this.colorsList.set([]);
    }

    this.addImageGalleryId.set('');
    this.addImageGalleryUrl.set('');
    this.activeTab.set('basic');
    this.showList.set(false);
  }

  /* ---------------- DELETE ---------------- */
  async onDelete(id: any) {
    const ok = await this.confirm.confirm({
      message: 'Are you sure you want to delete this Product?',
      confirmText: "Yes, I'm sure",
      cancelText: 'No, cancel',
      variant: 'danger',
    });

    if (ok) {
      this.productService.delete(id).subscribe({
        next: () => {
          this.products.update(list => list.filter(p => p.id !== id));
          this.toast.success('Product deleted successfully!', 'bottom-right', 5000);
        },
        error: (error) => {
          this.toast.danger(
            error?.error || 'Delete unsuccessful!',
            'bottom-left',
            3000
          );
          console.error('Error deleting Product:', error);
        }
      });
    }
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    this.model.set({
      companyID: environment.companyCode,
      title: '',
      description: '',
      categoryId: '0',
      brand: '',
      model: '',
      origin: '',
      sku: '',
      sl: 0,
      sizes: '',
      regularPrice: 0,
      offerPrice: 0,
      additionalInformation: '',
      specialFeature: '',
      catalogURL: '',
      youtubeLink: '',
      facebookPost: '',
      others: '',
      isActive: true,
    });

    this.selected.set(null);
    this.selectedGalleryId.set('');
    this.selectedGalleryUrl.set('');
    this.productImages.set([]);
    this.addImageGalleryId.set('');
    this.addImageGalleryUrl.set('');
    this.colorsList.set([]);
    this.relatedProductsList.set([]);
    this.isSubmitted.set(false);
    this.activeTab.set('basic');
    this.relatedSearchQuery.set('');
    this.filteredRelatedProducts.set([]);

    // Reset editor values
    this.editorDescription = '';
    this.editorSpecialFeature = '';
    this.editorAdditionalInfo = '';

    this.form().reset();
  }

  onToggleList() {
    this.showList.update(s => !s);
    this.formReset();
  }
}
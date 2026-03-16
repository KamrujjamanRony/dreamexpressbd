// product-list.ts
import { CommonModule, IMAGE_LOADER, ImageLoaderConfig, NgOptimizedImage } from '@angular/common';
import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass, faTrash } from '@fortawesome/free-solid-svg-icons';
import { form, FormField } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { SPermission } from '../../../services/s-permission';
import { SToast } from '../../../utils/toast/toast.service';
import { SConfirm } from '../../../utils/confirm/confirm.service';
import { ProductM, ProductColorsM } from '../../../models/Products';
import { BrandM } from '../../../models/Brand';
import { CategoryM } from '../../../models/Category';
import { SProduct } from '../../../services/s-product';
import { SBrand } from '../../../services/s-brand';
import { SCategory } from '../../../services/s-category';
import { environment } from '../../../../environments/environment';

interface ColorWithFile extends ProductColorsM {
  file?: File;
}

interface ImagePreview {
  file?: File;
  url: string;
}

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, FontAwesomeModule, FormField, NgOptimizedImage, FormsModule],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.css'],
  providers: [
    {
      provide: IMAGE_LOADER,
      useValue: (config: ImageLoaderConfig) => {
        return `${environment.ImageApi + config.src}?w=${config.width}`;
      },
    },
  ],
})
export class ProductList {
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;
  faTrash = faTrash;
  
  /* ---------------- DI ---------------- */
  private productService = inject(SProduct);
  private brandService = inject(SBrand);
  private categoryService = inject(SCategory);
  private permissionService = inject(SPermission);
  private toast = inject(SToast);
  private confirm = inject(SConfirm);
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('multipleFileInput') multipleFileInput!: ElementRef<HTMLInputElement>;
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
        const matchesCategory = !categoryId || product.itemId === categoryId;

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
  selectedFile = signal<File | null>(null);
  multipleFiles = signal<File[]>([]);
  previewUrl = signal<string | null>(null);
  multiplePreviews = signal<ImagePreview[]>([]);

  colorsList = signal<ProductColorsM[]>([]);
  colorsFiles = signal<{index: number, file: File}[]>([]);
  
  relatedProductsList = signal<number[]>([]);

  isLoading = signal(false);
  hasError = signal(false);

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);

  isSubmitted = signal(false);
  showList = signal(true);

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    companyID: environment.companyCode,
    title: '',
    description: '',
    itemId: '0',
    brand: '',
    model: '',
    origin: '',
    sku: '',
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
    return category?.itemName || '-';
  }

  getProductTitle(productId: number): string {
    const product = this.products().find(p => p.id === productId);
    return product?.title || 'Unknown';
  }

  isProductRelated(productId: number): boolean {
    return this.relatedProductsList().includes(productId);
  }

  /* ---------------- IMAGE HANDLERS ---------------- */
  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      if (!this.validateImageFile(file)) return;

      this.selectedFile.set(file);

      const reader = new FileReader();
      reader.onload = () => this.previewUrl.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  onMultipleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      const validFiles: File[] = [];

      for (const file of files) {
        if (this.validateImageFile(file, false)) {
          validFiles.push(file);
        }
      }

      if (validFiles.length === 0) return;

      // Create previews
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.multiplePreviews.update(prev => [
            ...prev, 
            { file, url: e.target?.result as string }
          ]);
        };
        reader.readAsDataURL(file);
      });

      this.multipleFiles.update(prev => [...prev, ...validFiles]);
      
      // Clear input
      input.value = '';
    }
  }

  onColorImageSelect(event: Event, index: number) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      if (!this.validateImageFile(file)) return;

      // Store file for later upload
      this.colorsFiles.update(prev => {
        const filtered = prev.filter(f => f.index !== index);
        return [...filtered, { index, file }];
      });

      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.colorsList.update(colors => {
          const updated = [...colors];
          updated[index] = {
            ...updated[index],
            image: e.target?.result as string
          };
          return updated;
        });
      };
      reader.readAsDataURL(file);
      
      // Clear input
      input.value = '';
    }
  }

  private validateImageFile(file: File, showToast = true): boolean {
    if (!file.type.startsWith('image/')) {
      if (showToast) this.toast.warning('Please select an image file', 'bottom-right', 5000);
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      if (showToast) this.toast.warning('Image size should be less than 5MB', 'bottom-right', 5000);
      return false;
    }

    return true;
  }

  clearFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    this.selectedFile.set(null);
  }

  clearMultipleFileInput() {
    if (this.multipleFileInput) {
      this.multipleFileInput.nativeElement.value = '';
    }
  }

  removeImage() {
    this.previewUrl.set(null);
    this.selectedFile.set(null);
    this.clearFileInput();
  }

  removeMultipleImage(index: number) {
    this.multiplePreviews.update(prev => prev.filter((_, i) => i !== index));
    this.multipleFiles.update(prev => prev.filter((_, i) => i !== index));
    this.clearMultipleFileInput();
  }

  removeColorImage(index: number) {
    this.colorsFiles.update(prev => prev.filter(f => f.index !== index));
    this.colorsList.update(colors => {
      const updated = [...colors];
      updated[index] = {
        ...updated[index],
        image: ''
      };
      return updated;
    });
  }

  /* ---------------- COLORS MANAGEMENT ---------------- */
  addColor() {
    this.colorsList.update(prev => [...prev, { colorName: '', image: '' }]);
  }

  removeColor(index: number) {
    this.colorsList.update(prev => prev.filter((_, i) => i !== index));
    this.colorsFiles.update(prev => prev.filter(f => f.index !== index).map(f => ({
      ...f,
      index: f.index > index ? f.index - 1 : f.index
    })));
  }

  /* ---------------- RELATED PRODUCTS ---------------- */
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

    if (!this.form().valid()) {
      this.toast.warning('Please fill all required fields!', 'bottom-right', 5000);
      return;
    }

    const formValue = this.form().value();
    
    // Validate required fields
    if (!formValue.itemId) {
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

    // Check if main image is selected for new items
    if (!this.selected() && !this.selectedFile()) {
      this.toast.warning('Please select a main image!', 'bottom-right', 5000);
      this.activeTab.set('images');
      return;
    }

    this.isSubmitted.set(true);

    const formData = new FormData();

    // Append all basic fields
    Object.entries(formValue).forEach(([key, value]) => {
      // itemId should be sent as numberic value
      if (key === 'itemId') {
        value = Number(value);
      }
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, String(value));
      }
    });

    // Append main image
    if (this.selectedFile()) {
      formData.append('ImageFile', this.selectedFile() as File);
    }

    // Append multiple images
    this.multipleFiles().forEach((file) => {
      formData.append('Images', file);
    });

    // Append colors
    if (this.colorsList().length > 0) {
      const colorsData = this.colorsList().map(color => ({
        colorName: color.colorName,
        image: color.image && !color.image.startsWith('data:') ? color.image : ''
      }));
      
      formData.append('Colors', JSON.stringify(colorsData));
      
      // Append color image files
      this.colorsFiles().forEach(({ file }) => {
        formData.append('ColorImages', file);
      });
    }

    // Append related products
    if (this.relatedProductsList().length > 0) {
      formData.append('RelatedProducts', JSON.stringify(this.relatedProductsList()));
    }

    const request$ = this.selected()
      ? this.productService.update(this.selected()!.id, formData)
      : this.productService.add(formData);

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
          error?.error?.message || 'Save unsuccessful!', 
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
      itemId: String(product.itemId || '0'),
      brand: product.brand || '',
      model: product.model || '',
      origin: product.origin || '',
      sku: product.sku || '',
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

    this.form().reset();

    // Set related products
    if (product.relatedProducts) {
      this.relatedProductsList.set(product.relatedProducts);
    }

    // Set colors
    if (product.productsColors) {
      this.colorsList.set(product.productsColors);
    }

    // Set main image preview
    if (product.imageUrl) {
      this.previewUrl.set(
        this.imgURL ? `${this.imgURL}${product.imageUrl}` : product.imageUrl
      );
    } else {
      this.previewUrl.set(null);
    }

    // Set multiple images preview
    if (product.images && product.images.length > 0) {
      const previews = product.images.map(img => ({
        file: undefined,
        url: this.imgURL ? `${this.imgURL}${img}` : img
      }));
      this.multiplePreviews.set(previews);
    } else {
      this.multiplePreviews.set([]);
    }

    this.selectedFile.set(null);
    this.multipleFiles.set([]);
    this.colorsFiles.set([]);
    this.clearFileInput();
    this.clearMultipleFileInput();
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
            error?.error?.message || 'Delete unsuccessful!', 
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
      itemId: '0',
      brand: '',
      model: '',
      origin: '',
      sku: '',
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
    this.selectedFile.set(null);
    this.multipleFiles.set([]);
    this.previewUrl.set(null);
    this.multiplePreviews.set([]);
    this.colorsList.set([]);
    this.colorsFiles.set([]);
    this.relatedProductsList.set([]);
    this.isSubmitted.set(false);
    this.activeTab.set('basic');

    this.form().reset();
    this.clearFileInput();
    this.clearMultipleFileInput();
  }

  onToggleList() {
    this.showList.update(s => !s);
    this.formReset();
  }
}
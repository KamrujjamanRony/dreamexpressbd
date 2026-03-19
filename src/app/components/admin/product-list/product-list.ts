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
import { catchError, Observable, of, switchMap } from 'rxjs';

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
  colorsFiles = signal<{ index: number, file: File }[]>([]);

  selectedColorImageIndex = signal<number | null>(null);
  relatedSearchQuery = signal('');
  filteredRelatedProducts = signal<ProductM[]>([]);
  isFilteringRelated = signal(false);
  isLoadingColors = signal(false);
  colorImageReferences = signal<{ colorIndex: number, imagePath: string }[]>([]);

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
    imageUrl: '',
    images: [] as any[],
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

  // Add this method to load colors when editing a product
  loadProductColors(productId: number) {
    this.isLoadingColors.set(true);

    this.productService.getColor(productId).subscribe({
      next: (colors) => {
        // Map the colors and ensure images are properly formatted
        const colorsWithUrls = colors.map(color => ({
          ...color,
          // If image is a path, prepend the image URL
          image: color.image ? (color.image.startsWith('http') ? color.image : `${this.imgURL}${color.image}`) : ''
        }));

        this.colorsList.set(colorsWithUrls);
        this.isLoadingColors.set(false);
      },
      error: (error) => {
        console.error('Error loading colors:', error);
        this.toast.danger('Failed to load product colors', 'bottom-right', 3000);
        this.isLoadingColors.set(false);
      }
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
    this.colorsList.update(colors => {
      const updated = [...colors];
      updated[index] = {
        ...updated[index],
        image: ''
      };
      return updated;
    });

    // Remove any references
    this.colorImageReferences.update(refs => refs.filter(r => r.colorIndex !== index));
    this.selectedColorImageIndex.set(null);
  }

  /* ---------------- COLORS MANAGEMENT ---------------- */
  selectColorImageFromProduct(colorIndex: number, imageIndex: number) {
    const preview = this.multiplePreviews()[imageIndex];
    if (preview) {
      this.colorsList.update(colors => {
        const updated = [...colors];
        updated[colorIndex] = {
          ...updated[colorIndex],
          image: preview.url
        };
        return updated;
      });

      // Store reference to the original product image if it's an existing image
      if (!preview.file && this.selected()) {
        // This is an existing product image from the server
        const productImage = this.selected()?.images?.[imageIndex];
        if (productImage) {
          // Store the image path for later submission
          this.colorImageReferences.update(refs => {
            const filtered = refs.filter(r => r.colorIndex !== colorIndex);
            return [...filtered, { colorIndex, imagePath: productImage }];
          });
        }
      } else if (preview.file) {
        // This is a newly uploaded image - will be handled by the main product upload
        // For now, we'll just use the data URL as preview
      }

      this.selectedColorImageIndex.set(imageIndex);
    }
  }

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
    formData.delete('colors');
    formData.delete('productColors');


    // Append all basic fields
    Object.entries(formValue).forEach(([key, value]) => {
      // itemId should be sent as numberic value
      if (key === 'itemId') {
        value = Number(value);
      }
      // images array should be sent key value[0], key value[1]... and so on
      if (key === 'images') {
        if (Array.isArray(value)) {
          value.forEach((img: any) => {
            formData.append(`images`, img);
          });
        }
        return;

      }
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, String(value));
      }
    });

    // first remove then Append isActive as numeric value (1 or 0)
    formData.delete('colors');
    formData.delete('productColors');
    formData.delete('isActive');
    formData.append('isActive', formValue.isActive ? '1' : '0');

    // Append main image
    if (this.selectedFile()) {
      formData.delete('ImageFile');
      formData.append('ImageFile', this.selectedFile() as File);
    }

    // Append multiple images
    this.multipleFiles().forEach((file) => {
      formData.append('ImageFiles', file);
    });

    // Append related products
    if (this.relatedProductsList().length > 0) {
      this.relatedProductsList().forEach((id: any) => {
        formData.append(`relatedProducts`, String(id));
      });
      return;
    }

    const request$ = this.selected()
      ? this.productService.update(this.selected()!.id, formData)
      : this.productService.add(formData);

    request$.subscribe({
      next: () => {
        // After product is saved, save colors if any      
        if (this.selected()) {
          this.saveColors(this.selected()!.id).subscribe({
            next: () => {
              this.loadProducts();
              this.onToggleList();
              this.toast.success('Product and colors saved successfully!', 'bottom-right', 5000);
              this.isSubmitted.set(false);
            },
            error: (colorError) => {
              console.error('Error saving colors:', colorError);
              this.toast.success('Product saved but colors failed to save', 'bottom-right', 5000);
              this.loadProducts();
              this.onToggleList();
              this.isSubmitted.set(false);
            }
          });
        } else {
          this.loadProducts();
          this.onToggleList();
          this.toast.success('Product saved successfully!', 'bottom-right', 5000);
          this.isSubmitted.set(false);
        }
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
      imageUrl: product.imageUrl || '',
      images: product.images || [],
    });

    this.form().reset();

    // Initialize filtered related products
    this.filteredRelatedProducts.set(this.availableProducts());

    // Set related products
    if (product.relatedProducts) {

      this.relatedProductsList.set(product.relatedProducts);
    }

    // Set colors


    // Load colors from API
    this.loadProductColors(product.id);

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
    this.colorImageReferences.set([]);
    this.clearFileInput();
    this.clearMultipleFileInput();
    this.activeTab.set('basic');
    this.showList.set(false);
  }

  // Add method to save colors separately
  saveColors(productId: number): Observable<any> {
    // Prepare colors data according to API format
    const colorsData = this.colorsList().map((color, index) => {
      // Check if this color uses an existing product image
      const imageRef = this.colorImageReferences().find(r => r.colorIndex === index);

      if (imageRef) {
        // Use existing image path
        return {
          colorName: color.colorName || '',
          image: imageRef.imagePath
        };
      } else if (color.image && !color.image.startsWith('data:')) {
        // This is an existing color with a server path
        // Extract just the filename/path without the base URL
        let imagePath = color.image;

        // Remove base URL if present
        if (this.imgURL && color.image.startsWith(this.imgURL)) {
          imagePath = color.image.replace(this.imgURL, '');
        }

        // Remove any leading slashes
        imagePath = imagePath.replace(/^\/+/, '');

        return {
          colorName: color.colorName || '',
          image: imagePath
        };
      } else if (color.image && color.image.startsWith('data:')) {
        // This is a new image with data URL - we need to upload it first
        // For now, return empty string (will need separate file upload)
        return {
          colorName: color.colorName || '',
          image: '' // Empty string for new images
        };
      } else {
        // Color without image
        return {
          colorName: color.colorName || '',
          image: ''
        };
      }
    });

    // Check if colors already exist for this product
    return this.productService.getColor(productId).pipe(
      switchMap(existingColors => {
        if (existingColors && existingColors.length > 0) {
          // Update existing colors
          return this.productService.updateColor(productId, colorsData);
        } else {
          // Add new colors
          return this.productService.addColor(productId, colorsData);
        }
      }),
      catchError(error => {
        console.error('Error saving colors:', error);
        // If getColor fails (maybe 404), try addColor
        return this.productService.addColor(productId, colorsData);
      })
    );
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
      imageUrl: '',
      images: [],
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

    this.selectedColorImageIndex.set(null);
    this.relatedSearchQuery.set('');
    this.filteredRelatedProducts.set([]);
    this.colorImageReferences.set([]);

    this.form().reset();
    this.clearFileInput();
    this.clearMultipleFileInput();
  }

  onToggleList() {
    this.showList.update(s => !s);
    this.formReset();
  }
}
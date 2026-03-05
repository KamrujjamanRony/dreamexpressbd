import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch, faPencil, faRemove } from '@fortawesome/free-solid-svg-icons';
import { BdtPipe } from '../../../pipes/bdt.pipe';
import { ProductForm } from '../../shared/product-form/product-form';
import { SProduct } from '../../../services/s-product';
import { SDataFetch } from '../../../services/s-data-fetch';
import { SAuth } from '../../../services/s-auth';
import { SCategory } from '../../../services/s-category';
import { SBrand } from '../../../services/s-brand';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, FontAwesomeModule, ProductForm, BdtPipe, NgOptimizedImage],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList {
  faSearch = faSearch;
  faPencil = faPencil;
  faRemove = faRemove;
  private productService = inject(SProduct);
  private dataFetchService = inject(SDataFetch);
  private authService = inject(SAuth);
  private CategoryService = inject(SCategory);
  private BrandService = inject(SBrand);

  isView = signal<boolean>(false);
  isInsert = signal<boolean>(false);
  isEdit = signal<boolean>(false);
  isDelete = signal<boolean>(false);
  filteredProductList = signal<any[]>([]);
  highlightedTr: number = -1;
  selectedProduct: any = null;
  showModal = false;
  modalTitle = 'Add New Product';
  categories = signal<string[]>([]);
  brands = signal<string[]>([]);

  private searchQuery$ = new BehaviorSubject<string>('');
  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;

  ngOnInit(): void {
    this.onLoadProducts();
    this.loadCategoriesAndBrands();

    this.isView.set(this.checkPermission("Product List", "View"));
    this.isInsert.set(this.checkPermission("Product List", "Insert"));
    this.isEdit.set(this.checkPermission("Product List", "Edit"));
    this.isDelete.set(this.checkPermission("Product List", "Delete"));
  }

  openAddModal() {
    this.modalTitle = 'Add New Product';
    this.selectedProduct = null;
    this.showModal = true;
  }

  openEditModal(product: any) {
    this.modalTitle = 'Edit Product';
    this.selectedProduct = product;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedProduct = null;
  }

  loadCategoriesAndBrands() {
    // For demonstration purposes, using hardcoded categories and brands
    this.CategoryService.search().subscribe(data => {
      this.categories.set(Array.isArray(data) ? data.map((cat: any) => cat.name) : []);
    });
    this.BrandService.search().subscribe(data => {
      this.brands.set(Array.isArray(data) ? data.map((brand: any) => brand.name) : []);
    });
    // this.productService.getCategories().subscribe(categories => {
    //   this.categories.set(categories);
    // });
    // this.productService.getBrands().subscribe(brands => {
    //   this.brands.set(brands);
    // });
  }

  onLoadProducts() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.productService.search());

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;

    combineLatest([
      data$,
      this.searchQuery$
    ]).pipe(
      map(([data, query]) =>
        data.filter((product: any) =>
          product.name?.toLowerCase().includes(query) ||
          product.sku?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query) ||
          product.brand?.toLowerCase().includes(query)
        )
      )
    ).subscribe(filteredData => {
      this.filteredProductList.set(filteredData);
    });
  }

  onSearchProduct(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery$.next(query);
  }

  handleFormSubmit(formData: any) {
    if (this.selectedProduct) {
      this.productService.update(this.selectedProduct.id, formData)
        .subscribe({
          next: (response) => {
            if (response) {
              // this.toastService.showMessage('success', 'Success', 'Product successfully updated!');
              this.onLoadProducts();
              this.closeModal();
            }
          },
          error: (error) => {
            console.error('Error updating product:', error);
            // this.toastService.showMessage('error', 'Error', `Error updating product: ${error.error.message || error.error.title}`);
          }
        });
    } else {
      this.productService.add(formData)
        .subscribe({
          next: (response: any) => {
            if (response) {
              // this.toastService.showMessage('success', 'Success', 'Product successfully added!');
              this.onLoadProducts();
              this.closeModal();
            }
          },
          error: (error) => {
            console.error('Error adding product:', error);
            // this.toastService.showMessage('error', 'Error', `Error adding product: ${error.error.message || error.error.title}`);
          }
        });
    }
  }

  onDelete(id: any) {
    if (confirm("Are you sure you want to delete this product?")) {
      this.productService.delete(id).subscribe({
        next: (response) => {
          // this.toastService.showMessage('success', 'Success', 'Product deleted successfully!');
          this.onLoadProducts();
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          // this.toastService.showMessage('error', 'Error', `Error deleting product: ${error.error.message || error.error.title}`);
        }
      });
    }
  }

  checkPermission(moduleName: string, permission: string) {
    const modulePermission = this.authService.getUser()?.userMenu?.find((module: any) => module?.menuName?.toLowerCase() === moduleName.toLowerCase());
    if (modulePermission) {
      const permissionValue = modulePermission.permissions.find((perm: any) => perm.toLowerCase() === permission.toLowerCase());
      if (permissionValue) {
        return true;
      }
    }
    return false;
  }

}

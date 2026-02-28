import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch, faPencil, faRemove } from '@fortawesome/free-solid-svg-icons';
import { BrandForm } from './brand-form/brand-form';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { SBrand } from '../../../services/s-brand';
import { SDataFetch } from '../../../services/s-data-fetch';
import { SAuth } from '../../../services/s-auth';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';

@Component({
  selector: 'app-brand-list',
  imports: [CommonModule, FontAwesomeModule, BrandForm],
  templateUrl: './brand-list.html',
  styleUrl: './brand-list.css',
})
export class BrandList {
  faSearch = faSearch;
  faPencil = faPencil;
  faRemove = faRemove;
  fb = inject(NonNullableFormBuilder);
  private BrandService = inject(SBrand);
  private dataFetchService = inject(SDataFetch);
  private authService = inject(SAuth);
  isView = signal<boolean>(false);
  isInsert = signal<boolean>(false);
  isEdit = signal<boolean>(false);
  isDelete = signal<boolean>(false);
  filteredBrandList = signal<any[]>([]);
  BrandOptions = signal<any[]>([]);
  highlightedTr: number = -1;
  selectedBrand: any;
  showModal = false;
  modalTitle = 'Add New Brand';

  private searchQuery$ = new BehaviorSubject<string>('');
  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  isSubmitted = signal<boolean>(false);
  options: any[] = ['View', 'Insert', 'Edit', 'Delete'];

  form = this.fb.group({
    name: ['', [Validators.required]],
  });

  ngOnInit() {
    this.onLoadBrand();
    this.isView.set(this.checkPermission("Brands", "View"));
    this.isInsert.set(this.checkPermission("Brands", "Insert"));
    this.isEdit.set(this.checkPermission("Brands", "Edit"));
    this.isDelete.set(this.checkPermission("Brands", "Delete"));
  }

  openAddModal() {
    this.modalTitle = 'Add New Brand';
    this.selectedBrand = null;
    this.showModal = true;
  }

  openEditModal(Brand: any) {
    this.modalTitle = 'Edit Brand';
    this.selectedBrand = Brand;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedBrand = null;
    this.isSubmitted.set(false);
  }

  handleFormSubmit(formData: any) {
    if (!this.isSubmitted()) {
      this.isSubmitted.set(true);
      if (this.selectedBrand) {
        this.BrandService.update(this.selectedBrand.id, formData).subscribe({
          next: (response) => {
            if (response) {
              // this.toastService.showMessage('success', 'Success', 'Brand successfully updated!');
              const rest = this.filteredBrandList().filter(d => d.id !== response.id);
              this.filteredBrandList.set([response, ...rest]);
              this.closeModal();
              this.onLoadBrand();
            }
          },
          error: (error) => {
            console.error('Error updating Brand:', error);
            // this.toastService.showMessage('error', 'Error', `Error updating Brand: ${error.error.message || error.error.title}`);
          }
        });
      } else {
        this.BrandService.add(formData).subscribe({
          next: (response) => {
            if (response) {
              // this.toastService.showMessage('success', 'Success', 'Brand successfully added!');
              this.filteredBrandList.set([response, ...this.filteredBrandList()]);
              this.closeModal();
              this.onLoadBrand();
            }
          },
          error: (error) => {
            console.error('Error adding Brand:', error);
            // this.toastService.showMessage('error', 'Error', `Error adding Brand: ${error.error.message || error.error.title}`);
          }
        });
      }
    }
  }


  checkPermission(moduleName: string, permission: string) {
    const modulePermission = this.authService.getUser()?.userMenu?.find((module: any) => module?.menuName?.toLowerCase() === moduleName.toLowerCase());
    if (modulePermission) {
      const permissionValue = modulePermission.permissions.find((perm: any) => perm.toLowerCase() === permission.toLowerCase());
      if (permissionValue) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  onLoadBrand() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.BrandService.search());

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
    // Combine the original data stream with the search query to create a filtered list
    combineLatest([
      data$,
      this.searchQuery$
    ]).pipe(
      map(([data, query]) =>
        data.filter((BrandData: any) =>
          BrandData.name?.toLowerCase().includes(query)
        )
      )
    ).subscribe(filteredData => {
      this.filteredBrandList.set(filteredData.reverse());
    });
  }

  // Method to filter Brand list based on search query
  onSearchBrand(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery$.next(query);
  }

  onDelete(id: any) {
    if (confirm("Are you sure you want to delete?")) {
      this.BrandService.delete(id).subscribe(data => {
        if (data.id) {
          // this.toastService.showMessage('success', 'Success', 'Brand successfully deleted!');
          this.filteredBrandList.set(this.filteredBrandList().filter(d => d.id !== id));
        } else {
          console.error('Error deleting Brand:', data);
          // this.toastService.showMessage('error', 'Error', `Error deleting Brand: ${data.message}`);
        }
      });
    }
  }

}

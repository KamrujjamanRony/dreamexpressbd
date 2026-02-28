import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch, faPencil, faRemove } from '@fortawesome/free-solid-svg-icons';
import { MenuForm } from './menu-form/menu-form';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { SMenu } from '../../../services/s-menu';
import { SDataFetch } from '../../../services/s-data-fetch';
import { SAuth } from '../../../services/s-auth';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';

@Component({
  selector: 'app-menus',
  imports: [CommonModule, MenuForm, FontAwesomeModule],
  templateUrl: './menus.html',
  styleUrl: './menus.css',
})
export class Menus {
  faSearch = faSearch;
  faPencil = faPencil;
  faRemove = faRemove;
  fb = inject(NonNullableFormBuilder);
  private menuService = inject(SMenu);
  private dataFetchService = inject(SDataFetch);
  private authService = inject(SAuth);
  isView = signal<boolean>(false);
  isInsert = signal<boolean>(false);
  isEdit = signal<boolean>(false);
  isDelete = signal<boolean>(false);
  filteredMenuList = signal<any[]>([]);
  menuOptions = signal<any[]>([]);
  highlightedTr: number = -1;
  selectedMenu: any;
  showModal = false;
  modalTitle = 'Add New Menu';

  private searchQuery$ = new BehaviorSubject<string>('');
  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  isSubmitted = false;
  options: any[] = ['View', 'Insert', 'Edit', 'Delete'];

  form = this.fb.group({
    menuName: ['', [Validators.required]],
    moduleName: [''],
    parentMenuId: [null],
    url: [''],
    isActive: [true],
    icon: [''],
    permissionsKey: [''],
  });

  ngOnInit() {
    this.onLoadMenu();
    this.isView.set(this.checkPermission("Menu List", "View"));
    this.isInsert.set(this.checkPermission("Menu List", "Insert"));
    this.isEdit.set(this.checkPermission("Menu List", "Edit"));
    this.isDelete.set(this.checkPermission("Menu List", "Delete"));
  }

  openAddModal() {
    this.modalTitle = 'Add New Menu';
    this.selectedMenu = null;
    this.showModal = true;
  }

  openEditModal(menu: any) {
    this.modalTitle = 'Edit Menu';
    this.selectedMenu = menu;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedMenu = null;
  }

  handleFormSubmit(formData: any) {
    if (this.selectedMenu) {
      this.menuService.update(this.selectedMenu.id, {
        ...formData,
        parentMenuId: formData.parentMenuId || null,
        permissionsKey: formData.permissionsKey || []
      }).subscribe({
        next: (response) => {
          if (response) {
            // this.toastService.showMessage('success', 'Success', 'Menu successfully updated!');
            const rest = this.filteredMenuList().filter(d => d.id !== response.id);
            this.filteredMenuList.set([response, ...rest]);
            this.closeModal();
            this.onLoadMenu();
          }
        },
        error: (error) => {
          console.error('Error updating Menu:', error);
          // this.toastService.showMessage('error', 'Error', `Error updating Menu: ${error.error.message || error.error.title}`);
        }
      });
    } else {
      this.menuService.add({
        ...formData,
        parentMenuId: formData.parentMenuId || null,
        permissionsKey: formData.permissionsKey || []
      }).subscribe({
        next: (response) => {
          if (response) {
            // this.toastService.showMessage('success', 'Success', 'Menu successfully added!');
            this.filteredMenuList.set([response, ...this.filteredMenuList()]);
            this.closeModal();
            this.onLoadMenu();
          }
        },
        error: (error) => {
          console.error('Error adding Menu:', error);
          // this.toastService.showMessage('error', 'Error', `Error adding Menu: ${error.error.message || error.error.title}`);
        }
      });
    }
  }


  checkPermission(moduleName: string, permission: string) {
    const user = this.authService.getUser();
    const modulePermission = user?.userMenu?.find((module: any) => module?.menuName?.toLowerCase() === moduleName.toLowerCase());
    if (modulePermission && user?.username.toLowerCase() === 'supersoft') {
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

  onLoadMenu() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.menuService.search());

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
    // Combine the original data stream with the search query to create a filtered list
    combineLatest([
      data$,
      this.searchQuery$
    ]).pipe(
      map(([data, query]) =>
        data.filter((menuData: any) =>
          menuData.menuName?.toLowerCase().includes(query) ||
          menuData.moduleName?.toLowerCase().includes(query) ||
          menuData.parentMenuId == query ||
          menuData.url?.toLowerCase().includes(query)
        )
      )
    ).subscribe(filteredData => {
      this.filteredMenuList.set(filteredData.reverse());
      this.menuOptions.set(filteredData.map((menuData: any) => ({ key: menuData.id, value: menuData.menuName })));
    });
  }

  // Method to filter Menu list based on search query
  onSearchMenu(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery$.next(query);
  }

  getParentMenuName(menuId: any): string {
    const parentMenu = this.menuOptions().find(m => m.key === menuId);
    return parentMenu?.value ?? '';
  }

  onDelete(id: any) {
    if (confirm("Are you sure you want to delete?")) {
      this.menuService.delete(id).subscribe(data => {
        if (data.id) {
          // this.toastService.showMessage('success', 'Success', 'Menu successfully deleted!');
          this.filteredMenuList.set(this.filteredMenuList().filter(d => d.id !== id));
        } else {
          console.error('Error deleting Menu:', data);
          // this.toastService.showMessage('error', 'Error', `Error deleting Menu: ${data.message}`);
        }
      });
    }
  }


}

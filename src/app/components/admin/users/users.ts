import { Component, computed, inject, signal } from '@angular/core';
import { UserAccessTree } from '../../shared/user-access-tree/user-access-tree';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { SUser } from '../../../services/s-user';
import { SMenu } from '../../../services/s-menu';
import { SAuth } from '../../../services/s-auth';
import { debounce, form, FormField, maxLength, minLength, required, validate } from '@angular/forms/signals';
import { environment } from '../../../../environments/environment';
import { SToast } from '../../../utils/toast/toast.service';
import { SConfirm } from '../../../utils/confirm/confirm.service';
import { MenuItem } from '../../../models/Menu';
import { UserFormM } from '../../../models/User';
import { SPermission } from '../../../services/s-permission';

@Component({
  selector: 'app-users',
  imports: [UserAccessTree, CommonModule, FontAwesomeModule, FormField],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users {
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;
  /* ---------------- DI ---------------- */
  private userS = inject(SUser);
  private menuS = inject(SMenu);    
  private auth = inject(SAuth);
  private permissionService = inject(SPermission);
  private toast = inject(SToast);
  private confirm = inject(SConfirm);

  /* ---------------- SIGNAL STATE ---------------- */

  loginUser = signal(this.auth.getUser());
  users = signal<any[]>([]);
  searchQuery = signal('');
  userAccessTree = signal<MenuItem[]>([]);
  selected = signal<any | null>(null);

  isLoading = signal(false);
  hasError = signal(false);
  isSubmitted = signal(false);
  showList = signal(true);

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);

  highlightedTr = signal<number>(-1);

  /* ---------------- COMPUTED ---------------- */

  filteredUserList = computed(() => {
    const query = this.searchQuery().toLowerCase() || '';
    return this.users()
      .filter(u => u.userName?.toLowerCase().includes(query))
    // .slice(1); // remove first element
  });

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    username: '',
    password: '',
    companyID: environment.companyCode,
    isActive: 'true',
    menuPermissions: [],
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.username, { message: 'Username is required' });
    required(schemaPath.password, { message: 'Password is required' });
    minLength(schemaPath.password, 6, { message: 'Password must be at least 6 character' })
    maxLength(schemaPath.password, 18, { message: 'Password cannot exceed 18 character' })
    validate(schemaPath.password, ({ value }) => {
      const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
      if (!specialCharRegex.test(value())) {
        return {
          kind: 'complexity',
          message: 'Password must contain at least one special character'
        }
      }
      return null
    })
    debounce(schemaPath.username, 500);
    debounce(schemaPath.password, 500);
  });

  /* ---------------- LIFECYCLE ---------------- */

  ngOnInit(): void {
    this.loadPermissions();
    this.loadUsers();
    this.loadTreeData('');
  }

  /* ---------------- LOADERS ---------------- */

  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('User', 'view'));
    this.isInsert.set(this.permissionService.hasPermission('User', 'create'));
    this.isEdit.set(this.permissionService.hasPermission('User', 'edit'));
    this.isDelete.set(this.permissionService.hasPermission('User', 'delete'));
  }

  loadUsers() {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.userS.search().subscribe({
      next: data => {
        this.users.set(data ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  loadTreeData(userId: any) {
    this.menuS
      .generateTreeData(userId)
      .subscribe(tree => {
        this.userAccessTree.set(tree)
      });
  }

  /* ---------------- SEARCH ---------------- */

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  /* ---------------- SUBMIT ---------------- */
  onSubmit(event: Event) {
    event.preventDefault();

    if (!this.form().valid()) {
      this.toast.warning('Form is Invalid!', 'bottom-right', 5000);
      return;
    }
      this.isSubmitted.set(true);

      // Create the payload with proper types
      const formValue = this.form().value();

      const payload: UserFormM = {
        username: formValue.username,
        password: formValue.password,
        postBy: this.loginUser().username || '',
        companyID: formValue.companyID,
        isActive: formValue.isActive === 'true', // Convert string to boolean
        menuPermissions: this.userAccessTree(),
      };

      const request$ = this.selected()
        ? this.userS.update(this.selected()!.id, payload)
        : this.userS.add(payload);

      request$.subscribe({
        next: () => {
          this.loadUsers();
          this.onToggleList();
        this.toast.success('Saved successfully!', 'bottom-right', 5000);
        },
        error: (err) => {
        this.toast.danger('Saved unsuccessful!', 'bottom-left', 3000);
          console.error('Error submitting form:', err);
          this.isSubmitted.set(false);
        }
      });
  }

  /* ---------------- UPDATE ---------------- */
  onUpdate(user: any) {
    this.selected.set({ ...user, username: user.userName });
    this.loadTreeData(user.id);
    console.log(this.selected());

    // Update the form model
    this.model.update(current => ({
      ...current,
      username: user.userName,
      password: user.password ?? '',
      companyID: user.companyID ?? environment.companyCode,
      isActive: user.isActive ? 'true' : 'false',
      menuPermissions: user.menuPermissions ?? []
    }));

    // Reset validation states
    this.form().reset();
    this.showList.set(false);
  }

  /* ---------------- DELETE ---------------- */
  async onDelete(id: any) {
    const ok = await this.confirm.confirm({
      message: 'Are you sure you want to delete this User?',
      confirmText: "Yes, I'm sure",
      cancelText: 'No, cancel',
      variant: 'danger',
    });

    if (ok) {
      // Delete User
      this.userS.delete(id).subscribe({
        next: () => {
          this.users.update(list => list.filter(i => i.id !== id));
          this.toast.success('User deleted successfully!', 'bottom-right', 5000);
        },
        error: (error) => {
        this.toast.danger('User deleted unsuccessful!', 'bottom-left', 3000);
          console.error('Error deleting User:', error);
        }
      });
    }
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    // Reset the model
    this.model.set({
      username: '',
      password: '',
      companyID: environment.companyCode,
      isActive: 'true',
      menuPermissions: [],
    });
    this.loadTreeData('');
    this.selected.set(null);
    this.isSubmitted.set(false);
    this.form().reset();
  }

  onToggleList() {
    this.showList.update(s => !s);
    this.formReset();
  }

}

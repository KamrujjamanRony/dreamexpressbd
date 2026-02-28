import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { SettingsForm } from './settings-form/settings-form';
import { SSetting } from '../../../services/s-setting';
import { SDataFetch } from '../../../services/s-data-fetch';
import { SAuth } from '../../../services/s-auth';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, SettingsForm],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  private siteSettingService = inject(SSetting);
  private dataFetchService = inject(SDataFetch);
  private authService = inject(SAuth);

  isView = signal<boolean>(false);
  isEdit = signal<boolean>(false);
  settings = signal<any>(null);
  siteId = environment.companyCode;
  showModal = false;

  isLoading$: Observable<boolean> | undefined;
  hasError$: Observable<boolean> | undefined;

  ngOnInit() {
    this.loadSettings();
    this.isView.set(this.checkPermission("SiteSettings", "View"));
    this.isEdit.set(this.checkPermission("SiteSettings", "Edit"));
  }

  loadSettings() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(
      this.siteSettingService.get(this.siteId)
    );

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;

    data$.subscribe(settings => {
      this.settings.set(settings);
    });
  }

  openEditModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  updateSettings(formData: any) {
    this.siteSettingService.update(this.siteId, formData).subscribe({
      next: (response) => {
        // this.toastService.showMessage('success', 'Success', 'Settings updated successfully!');
        this.settings.set(response);
        this.closeModal();
      },
      error: (error) => {
        console.error('Error updating settings:', error);
        // this.toastService.showMessage('error', 'Error', `Error updating settings: ${error.error.message || error.error.title}`);
      }
    });
  }

  checkPermission(moduleName: string, permission: string) {
    const modulePermission = this.authService.getUser()?.userMenu?.find(
      (module: any) => module?.menuName?.toLowerCase() === moduleName.toLowerCase()
    );
    return !!modulePermission?.permissions?.find(
      (perm: any) => perm.toLowerCase() === permission.toLowerCase()
    );
  }

}

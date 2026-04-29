import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class SAuth {
  hasPermission(arg0: string, arg1: string): boolean {
    throw new Error('Method not implemented.');
  }
  private memoryCache: any = null;
  private storageKey = '*_*';
  private encryptionKey = 'your-dynamic-key'; // In production, fetch from API/backend
  private router = inject(Router);

  constructor() {
    // Restore from secure storage on service init
    this.restoreUser();

    // Backup to secure storage before page unload
    window.addEventListener('beforeunload', () => this.backupUser());      // todo: this.backupUser()
  }

  setUser(user: any) {
    this.memoryCache = user;
    this.backupUser(); // Optional: Persist immediately
  }

  getUser() {
    return this.memoryCache;
  }

  deleteUser() {
    this.memoryCache = null;
    localStorage.removeItem(this.storageKey);
    this.router.navigate(['/admin-login']);
  }

  private backupUser() {
    if (this.memoryCache) {
      try {
        const json = JSON.stringify(this.memoryCache);
        const encoded = btoa(encodeURIComponent(json));
        localStorage.setItem(this.storageKey, encoded);
      } catch { }
    }
  }

  private restoreUser() {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      // Try new format (base64)
      try {
        const json = decodeURIComponent(atob(stored));
        this.memoryCache = JSON.parse(json);
        return;
      } catch { }
      // Legacy crypto-js format: load dynamically and migrate
      this.restoreLegacy(stored);
    }
  }

  private async restoreLegacy(encrypted: string) {
    try {
      const CryptoJS = (await import('crypto-js')).default;
      const decrypted = CryptoJS.AES.decrypt(
        encrypted,
        this.encryptionKey
      ).toString(CryptoJS.enc.Utf8);
      this.memoryCache = JSON.parse(decrypted);
      // Re-save in new format so crypto-js is never needed again
      this.backupUser();
    } catch (e) {
      this.deleteUser(); // Clear corrupted data
    }
  }

}

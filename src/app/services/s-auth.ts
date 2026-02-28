import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root',
})
export class SAuth {
  private memoryCache: any = null;
  private storageKey = '*_*';
  private encryptionKey = 'your-dynamic-key'; // In production, fetch from API/backend

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
  }

  private backupUser() {
    if (this.memoryCache) {
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(this.memoryCache),
        this.encryptionKey
      ).toString();
      localStorage.setItem(this.storageKey, encrypted);
    }
  }

  private restoreUser() {
    const encrypted = localStorage.getItem(this.storageKey);
    if (encrypted) {
      try {
        const decrypted = CryptoJS.AES.decrypt(
          encrypted,
          this.encryptionKey
        ).toString(CryptoJS.enc.Utf8);
        this.memoryCache = JSON.parse(decrypted);
      } catch (e) {
        this.deleteUser(); // Clear corrupted data
      }
    }
  }
  
}

import { inject, Injectable } from '@angular/core';
import { SAuth } from './s-auth';

@Injectable({
  providedIn: 'root',
})
export class SPermission {
  private auth = inject(SAuth);

  hasPermission(moduleName: string, permission: string = ''): boolean {
    const user = this.auth.getUser(); // ✅ signal read

    if (!user || !user.userMenu) return false;

    const module = user.userMenu.find(
      (m: any) =>
        m.menuName?.toLowerCase() === moduleName.toLowerCase()
    );

    if (!module) return false;

    // Only module access check
    if (!permission) return true;

    if (!Array.isArray(module.permissions)) return false;

    return module.permissions.some(
      (p: string) =>
        p.toLowerCase() === permission.toLowerCase()
    );
  }
  
}

import { Injectable, signal } from '@angular/core';
import { ConfirmOptions } from './confirm.model';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private resolver!: (value: boolean) => void;

  readonly isOpen = signal(false);
  readonly options = signal<ConfirmOptions | null>(null);

  confirm(options: ConfirmOptions): Promise<boolean> {
    this.options.set({
      confirmText: "Yes, I'm sure",
      cancelText: 'Cancel',
      variant: 'danger',
      ...options,
    });

    this.isOpen.set(true);

    return new Promise<boolean>(resolve => {
      this.resolver = resolve;
    });
  }

  accept() {
    this.close(true);
  }

  cancel() {
    this.close(false);
  }

  private close(result: boolean) {
    this.isOpen.set(false);
    this.options.set(null);
    this.resolver?.(result);
  }
}

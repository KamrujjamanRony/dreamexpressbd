import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { ToastM, ToastPosition } from './toast.model';

@Component({
    selector: 'app-toast',
    imports: [CommonModule],
    templateUrl: './toast.html',
    styleUrl: './toast.css',
})
export class Toast {
  public toastService = inject(ToastService);

  // 🔑 THIS fixes the typing issue
  readonly positions: readonly ToastPosition[] = [
    'top-right',
    'top-left',
    'bottom-right',
    'bottom-left',
  ];

  iconBg(type: ToastM['type']) {
    return {
      success: 'bg-success-soft',
      danger: 'bg-danger-soft',
      warning: 'bg-warning-soft',
    }[type];
  }

  containerClass(pos: ToastPosition) {
    return {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
    }[pos];
  }

}
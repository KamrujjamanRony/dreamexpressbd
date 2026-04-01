import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { SToast } from './toast.service';
import { ToastM, ToastPosition } from './toast.model';

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast {
  public toastService = inject(SToast);

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

}
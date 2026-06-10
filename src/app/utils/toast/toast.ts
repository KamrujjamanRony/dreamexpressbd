import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { SToast } from './toast.service';
import { ToastM, ToastPosition } from './toast.model';

@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './toast.css',
})
export class Toast {
  public toastService = inject(SToast);

  readonly positions: readonly ToastPosition[] = [
    'top-center',
    'top-right',
    'top-left',
    'bottom-right',
    'bottom-left',
    'bottom-center',
    'center',
  ];

  typeClass(type: ToastM['type']) {
    return {
      success: 'toast-success',
      danger: 'toast-danger',
      warning: 'toast-warning',
    }[type];
  }

  containerClass(pos: ToastPosition) {
    return {
      'top-center': 'top-6 left-1/2 -translate-x-1/2',
      'top-right': 'top-6 right-6',
      'top-left': 'top-6 left-6',
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6',
      'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
      'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    }[pos];
  }
}
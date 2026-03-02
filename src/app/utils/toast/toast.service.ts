import { Injectable, signal, computed } from '@angular/core';
import { ToastM, ToastType, ToastPosition } from './toast.model';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private id = 0;
  private timers = new Map<number, any>();

  private _toasts = signal<ToastM[]>([]);
  readonly toasts = this._toasts.asReadonly();

  readonly toastsByPosition = computed(() => {
    return this._toasts().reduce<Record<ToastPosition, ToastM[]>>(
      (acc, t) => {
        acc[t.position].push(t);
        return acc;
      },
      {
        'top-right': [],
        'top-left': [],
        'bottom-right': [],
        'bottom-left': [],
      }
    );
  });

  show(
    type: ToastType,
    message: string,
    position: ToastPosition = 'top-right',
    duration = 3000,
    replace = false
  ) {
    const now = Date.now();

    const toast: ToastM = {
      id: ++this.id,
      message,
      type,
      position,
      duration,
      paused: false,
      startTime: now,
      remaining: duration,
    };

    this._toasts.update(list => {
      if (replace) {
        return [...list.filter(t => t.position !== position), toast];
      }
      return [...list, toast];
    });

    this.startTimer(toast);
  }

  success(msg: string, pos?: ToastPosition, d?: number, r?: boolean) {
    this.show('success', msg, pos, d, r);
  }
  danger(msg: string, pos?: ToastPosition, d?: number, r?: boolean) {
    this.show('danger', msg, pos, d, r);
  }
  warning(msg: string, pos?: ToastPosition, d?: number, r?: boolean) {
    this.show('warning', msg, pos, d, r);
  }

  pause(id: number) {
    const t = this.timers.get(id);
    if (t) {
      clearTimeout(t);
      this.timers.delete(id);
      this._toasts.update(list =>
        list.map(x =>
          x.id === id
            ? {
                ...x,
                paused: true,
                remaining:
                  x.remaining - (Date.now() - x.startTime),
              }
            : x
        )
      );
    }
  }

  resume(id: number) {
    this._toasts.update(list =>
      list.map(x =>
        x.id === id
          ? { ...x, paused: false, startTime: Date.now() }
          : x
      )
    );

    const toast = this._toasts().find(t => t.id === id);
    if (toast) this.startTimer(toast);
  }

  remove(id: number) {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private startTimer(toast: ToastM) {
    const timer = setTimeout(() => this.remove(toast.id), toast.remaining);
    this.timers.set(toast.id, timer);
  }
}

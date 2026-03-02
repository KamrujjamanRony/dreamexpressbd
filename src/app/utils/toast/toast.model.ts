export type ToastType = 'success' | 'danger' | 'warning';
export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left';

export interface ToastM {
  id: number;
  message: string;
  type: ToastType;
  position: ToastPosition;
  duration: number;
  paused: boolean;
  startTime: number;
  remaining: number;
}

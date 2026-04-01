export type ToastType = 'success' | 'danger' | 'warning';
export type ToastPosition =
  | 'top-center'
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'top-left'
  | 'bottom-center'
  | 'center';

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

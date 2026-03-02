import { Component, inject } from '@angular/core';
import { ConfirmService } from './confirm.service';

@Component({
  selector: 'app-confirm',
  imports: [],
  templateUrl: './confirm.html',
  styleUrl: './confirm.css',
})
export class Confirm {
  readonly confirm = inject(ConfirmService);

  iconClass(variant: string | undefined) {
    return {
      danger: 'text-fg-danger',
      warning: 'text-fg-warning',
      info: 'text-fg-disabled',
    }[variant ?? 'info'];
  }

  buttonClass(variant: string | undefined) {
    return {
      danger: 'bg-danger hover:bg-danger-strong focus:ring-danger-medium',
      warning: 'bg-warning hover:bg-warning-strong focus:ring-warning-medium',
      info: 'bg-brand hover:bg-brand-strong focus:ring-brand-medium',
    }[variant ?? 'info'];
  }

}

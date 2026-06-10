import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { BreadcrumbService } from './breadcrumb.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  templateUrl: './breadcrumb.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './breadcrumb.css',
})
export class Breadcrumb {
  readonly bc = inject(BreadcrumbService);

}

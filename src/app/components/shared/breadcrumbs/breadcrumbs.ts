import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-breadcrumbs',
  imports: [RouterLink],
  templateUrl: './breadcrumbs.html',
  styleUrl: './breadcrumbs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Breadcrumbs {
  name = input<any>(null);
}

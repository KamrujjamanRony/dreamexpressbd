import { Component, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../components/shared/sidebar/sidebar';
import { Breadcrumb } from '../../utils/breadcrumb/breadcrumb';

@Component({
  selector: 'app-admin',
  imports: [RouterOutlet, Sidebar, Breadcrumb],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class Admin {

}

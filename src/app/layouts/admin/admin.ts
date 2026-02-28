import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../components/shared/sidebar/sidebar';

@Component({
  selector: 'app-admin',
  imports: [RouterOutlet, Sidebar],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {

}

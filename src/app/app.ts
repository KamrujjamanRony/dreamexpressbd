import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { Toast } from './utils/toast/toast';
import { Confirm } from "./utils/confirm/confirm";
import { ThemeToggle } from "./utils/theme-toggle/theme-toggle";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast, Confirm, ThemeToggle],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal(environment.companyName);
}

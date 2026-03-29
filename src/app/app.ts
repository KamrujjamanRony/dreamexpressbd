import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { Toast } from './utils/toast/toast';
import { Confirm } from "./utils/confirm/confirm";
import { SocialChat } from "./utils/social-chat/social-chat";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast, Confirm, SocialChat],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal(environment.companyName);
}

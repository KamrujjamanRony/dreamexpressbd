import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { Toast } from './utils/toast/toast';
import { Confirm } from "./utils/confirm/confirm";
import { SocialChat } from "./utils/social-chat/social-chat";
import { SSeo } from './services/s-seo';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast, Confirm, SocialChat],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private seo = inject(SSeo);
  protected readonly title = signal(environment.companyName);

  ngOnInit() {
    this.seo.init();
  }
}

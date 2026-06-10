import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { environment } from '../../../environments/environment';
import { SContact } from '../../services/s-contact';
import { STheme } from '../theme-toggle/s-theme';

@Component({
  selector: 'app-social-chat',
  imports: [],
  templateUrl: './social-chat.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './social-chat.css',
})
export class SocialChat implements OnInit {
  private contactService = inject(SContact);
  private themeService = inject(STheme);

  isOpen = false;
  isVisible = true;
  isDarkMode = false;
  whatsappLink = '';
  messengerLink = '';
  phoneNumber = '';

  ngOnInit() {
    this.themeService.darkMode$.subscribe(isDark => this.isDarkMode = isDark);

    const waNumber = environment.whatsappNumber;
    if (waNumber) {
      this.whatsappLink = `https://wa.me/${waNumber}`;
    }

    const messengerUsername = environment.messengerUsername;
    if (messengerUsername) {
      this.messengerLink = `https://www.facebook.com/messages/t/${messengerUsername}`;
    }

    this.contactService.get(environment.companyCode).subscribe({
      next: (contact) => {
        const phone = contact.contactCards?.find(c => c.type?.toLowerCase() === 'phone')?.value;
        if (phone) {
          this.phoneNumber = `tel:${phone}`;
        }
      },
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  hide() {
    this.isOpen = false;
    this.isVisible = false;
  }

  show() {
    this.isVisible = true;
  }
}

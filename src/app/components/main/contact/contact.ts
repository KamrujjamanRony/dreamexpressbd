import { Component, ElementRef, inject, signal, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SContact } from '../../../services/s-contact';
import { SToast } from '../../../utils/toast/toast.service';
import { ContactM } from '../../../models/Contact';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-contact',
  imports: [FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact implements AfterViewInit, OnDestroy {
  private contactService = inject(SContact);
  private toast = inject(SToast);
  private el = inject(ElementRef);
  private observer?: IntersectionObserver;

  siteId = environment.companyCode;
  companyName = environment.companyName;
  contactInfo = signal<ContactM | null>(null);
  loading = signal(true);
  ready = signal(false);

  // Contact form
  formName = '';
  formPhone = '';
  formSubject = '';
  formMessage = '';
  sending = signal(false);

  ngOnInit() {
    this.contactService.get(this.siteId).subscribe({
      next: (data) => {
        this.contactInfo.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    setTimeout(() => this.ready.set(true), 100);
  }

  ngAfterViewInit() {
    this.observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('in-view');
      }),
      { threshold: 0.15 }
    );
    this.el.nativeElement.querySelectorAll('.animate-on-scroll').forEach((el: Element) =>
      this.observer!.observe(el)
    );
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  submitForm() {
    if (!this.formName.trim() || !this.formPhone.trim() || !this.formMessage.trim()) {
      this.toast.warning('Please fill in all required fields', 'top-right', 3000);
      return;
    }
    this.sending.set(true);
    this.contactService.submitContactUs({
      fullName: this.formName.trim(),
      phone: this.formPhone.trim(),
      email: '',
      subject: this.formSubject.trim(),
      message: this.formMessage.trim(),
    }).subscribe({
      next: () => {
        this.toast.success('Thank you for your message! We\'ll get back to you soon.', 'top-right', 4000);
        this.formName = '';
        this.formPhone = '';
        this.formSubject = '';
        this.formMessage = '';
        this.sending.set(false);
      },
      error: () => {
        this.toast.danger('Failed to send message. Please try again.', 'top-right', 3000);
        this.sending.set(false);
      },
    });
  }
}

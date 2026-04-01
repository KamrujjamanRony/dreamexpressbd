import { Component, computed, ElementRef, inject, signal, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SAbout } from '../../../services/s-about';
import { SContact } from '../../../services/s-contact';
import { SGallery } from '../../../services/s-gallery';
import { AboutUsM } from '../../../models/AboutUs';
import { ContactM } from '../../../models/Contact';
import { environment } from '../../../../environments/environment';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faMapMarkerAlt,
  faPhone,
  faEnvelope,
  faChevronDown,
  faLink,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About implements AfterViewInit, OnDestroy {
  private aboutService = inject(SAbout);
  private contactService = inject(SContact);
  private galleryService = inject(SGallery);
  private el = inject(ElementRef);
  private observer?: IntersectionObserver;

  /* Icons */
  faMapMarkerAlt = faMapMarkerAlt;
  faPhone = faPhone;
  faEnvelope = faEnvelope;
  faLink = faLink;
  faChevronDown = faChevronDown;

  siteId = environment.companyCode;
  companyName = environment.companyName;
  imgBase = environment.ImageApi;
  aboutData = signal<AboutUsM | null>(null);
  contactData = signal<ContactM | null>(null);
  loading = signal(true);
  ready = signal(false);
  expandedFaqIndex = signal<number | null>(null);

  /* Gallery image resolution map */
  galleryMap = signal<Map<string, string>>(new Map());

  /* Computed Contact Data */
  quickInfo = computed(() => this.contactData()?.quickInfo || []);
  faqs = computed(() => this.contactData()?.faqs || []);
  contactCards = computed(() => this.contactData()?.contactCards || []);
  hasDeliveryCharges = computed(() => {
    const charges = this.contactData()?.deliveryCharges;
    return Array.isArray(charges) && charges.length > 0;
  });

  ngOnInit() {
    this.loadGalleryImages();
    this.aboutService.get(this.siteId).subscribe({
      next: (data) => {
        this.aboutData.set(data);
        this.loadContactData();
        setTimeout(() => this.observeElements(), 100);
      },
      error: () => {
        this.loadContactData();
      }
    });
    setTimeout(() => this.ready.set(true), 100);
  }

  private loadGalleryImages() {
    this.galleryService.search().subscribe({
      next: (data) => {
        const map = new Map<string, string>();
        data.forEach(img => {
          if (img.id) map.set(`galleryId-${img.id}`, img.imageUrl);
        });
        this.galleryMap.set(map);
      }
    });
  }

  resolveGalleryUrl(ref?: string): string {
    if (!ref) return '';
    const url = this.galleryMap().get(ref);
    return url ? this.imgBase + url : '';
  }

  private loadContactData() {
    this.contactService.get(this.siteId).subscribe({
      next: (data) => {
        this.contactData.set(data);
        this.loading.set(false);
        setTimeout(() => this.observeElements(), 100);
      },
      error: () => this.loading.set(false)
    });
  }

  ngAfterViewInit() {
    this.setupObserver();
    this.observeElements();
  }

  private setupObserver() {
    this.observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('in-view');
      }),
      { threshold: 0.15 }
    );
  }

  private observeElements() {
    this.el.nativeElement.querySelectorAll('.animate-on-scroll:not(.in-view)').forEach((el: Element) =>
      this.observer?.observe(el)
    );
  }

  toggleFaq(index: number) {
    if (this.expandedFaqIndex() === index) {
      this.expandedFaqIndex.set(null);
    } else {
      this.expandedFaqIndex.set(index);
    }
  }

  getSocialIcon(type: string): IconDefinition {
    return this.faLink;
  }

  getContactCardIcon(type: string): IconDefinition {
    switch (type.toLowerCase()) {
      case 'phone': return this.faPhone;
      case 'email': return this.faEnvelope;
      case 'address': return this.faMapMarkerAlt;
      default: return this.faPhone;
    }
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}

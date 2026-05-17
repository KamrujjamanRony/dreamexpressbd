import { ChangeDetectionStrategy, Component, inject, signal, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { SAbout } from '../../../services/s-about';
import { SContact } from '../../../services/s-contact';
import { AboutUsM } from '../../../models/AboutUs';
import { ContactM } from '../../../models/Contact';
import { SafeHtmlPipe } from '../../../pipes/safe-html.pipe';

@Component({
    selector: 'app-footer',
    imports: [RouterLink, SafeHtmlPipe],
    templateUrl: './footer.html',
    styleUrl: './footer.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer implements AfterViewInit, OnDestroy {
    private aboutService = inject(SAbout);
    private contactService = inject(SContact);
    private el = inject(ElementRef);
    private observer?: IntersectionObserver;

    siteId = environment.companyCode;
    companyName = environment.companyName;
    aboutData = signal<AboutUsM | null>(null);
    contactData = signal<ContactM | null>(null);
    currentYear = new Date().getFullYear();

    ngOnInit() {
        this.aboutService.get(this.siteId).subscribe({
            next: (data) => this.aboutData.set(data),
        });
        this.contactService.get(this.siteId).subscribe({
            next: (data) => this.contactData.set(data),
        });
    }

    getCardIcon(type: string): string {
        const icons: Record<string, string> = {
            phone: 'fas fa-phone-alt',
            email: 'fas fa-envelope',
            address: 'fas fa-map-marker-alt',
            hours: 'fas fa-clock',
        };
        return icons[type?.toLowerCase()] || 'fas fa-info-circle';
    }

    ngAfterViewInit() {
        this.observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => {
                if (e.isIntersecting) e.target.classList.add('in-view');
            }),
            { threshold: 0.1 }
        );
        this.el.nativeElement.querySelectorAll('.footer-animate').forEach((el: Element) =>
            this.observer!.observe(el)
        );
    }

    ngOnDestroy() {
        this.observer?.disconnect();
    }
}

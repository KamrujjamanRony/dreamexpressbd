import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
    name: 'bdt',
    standalone: true
})
export class BdtPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) { }

    transform(value: number | null | undefined): SafeHtml {
        if (value === null || value === undefined || isNaN(value)) {
            return this.sanitizer.bypassSecurityTrustHtml('');
        }

        const formattedValue = value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const html = `<span class="bdt-symbol">৳</span> <span class="bdt-amount">${formattedValue}</span>`;

        return this.sanitizer.bypassSecurityTrustHtml(html);
    }
}
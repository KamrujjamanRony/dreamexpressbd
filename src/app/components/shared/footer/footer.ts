import { Component, inject, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { SSetting } from '../../../services/s-setting';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-footer',
  imports: [NgOptimizedImage],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
    private settingService = inject(SSetting);
    siteId = environment.companyCode;
    siteInfo = signal<any>(null);

    ngOnInit() {
        // this.settingService.get(this.siteId).subscribe({
        //     next: (data) => {
        //         console.log(data);
        //         this.siteInfo.set(data);
        //     },
        //     error: (err) => {
        //         // this.toastService.showMessage('error', 'Error', 'Failed to load about us information.');
        //         console.error('Failed to load about us information:', err);
        //     }
        // });
    }

}

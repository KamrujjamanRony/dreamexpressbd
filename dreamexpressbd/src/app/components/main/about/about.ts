import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { SSetting } from '../../../services/s-setting';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-about',
  imports: [CommonModule],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About {
    // private siteSettingService = inject(SSetting);
    siteId = environment.companyCode;
    siteInfo = signal<any>(null);

    // ngOnInit() {
    //     this.siteSettingService.get(this.siteId).subscribe({
    //         next: (data: any) => {
    //             this.siteInfo.set(data);
    //         },
    //         error: (err: any) => {
    //             // this.toastService.showMessage('error', 'Error', 'Failed to load about us information.');
    //             console.error('Failed to load about us information:', err);
    //         }
    //     });
    // }

}

import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-view-content',
  imports: [],
  templateUrl: './view-content.html',
  styleUrl: './view-content.css',
})
export class ViewContent {
  @Input() product: any;
  activeTab = 'specs';

  ngOnInit() {
    if (this.product?.specifications?.length > 0) {
      this.activeTab = 'specs';
    } else if (this.product?.productDetails) {
      this.activeTab = 'details';
    } else if (this.product?.additionalInformation) {
      this.activeTab = 'info';
    } else if (this.product?.specialFeature) {
      this.activeTab = 'feature';
    }
  }
}

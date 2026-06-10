import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-view-content',
  imports: [],
  templateUrl: './view-content.html',
  styleUrl: './view-content.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewContent {
  product = input<any>(null);
  activeTab = 'specs';

  ngOnInit() {
    const p = this.product();
    if (p?.specifications?.length > 0) {
      this.activeTab = 'specs';
    } else if (p?.productDetails) {
      this.activeTab = 'details';
    } else if (p?.additionalInformation) {
      this.activeTab = 'info';
    } else if (p?.specialFeature) {
      this.activeTab = 'feature';
    }
  }
}

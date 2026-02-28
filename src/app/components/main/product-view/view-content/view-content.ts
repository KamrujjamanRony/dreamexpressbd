import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-view-content',
  imports: [],
  templateUrl: './view-content.html',
  styleUrl: './view-content.css',
})
export class ViewContent {
  @Input() product: any;

}

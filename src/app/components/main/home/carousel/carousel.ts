import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-carousel',
  imports: [RouterLink],
  templateUrl: './carousel.html',
  styleUrl: './carousel.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Carousel {  
    carousels = input<any[]>([]);

}

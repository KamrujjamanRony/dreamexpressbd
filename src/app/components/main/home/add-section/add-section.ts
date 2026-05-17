import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-add-section',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './add-section.html',
  styleUrl: './add-section.css',
})
export class AddSection {

}

import { Component, input } from '@angular/core';

@Component({
  selector: 'Field',
  imports: [],
  templateUrl: './field.html',
  styleUrl: './field.css',
})
export class Field {
  readonly label = input<string>('');
  readonly isInvalid = input<boolean>(false);

}

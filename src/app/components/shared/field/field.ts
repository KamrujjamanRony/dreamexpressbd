import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'Field',
  imports: [],
  templateUrl: './field.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './field.css',
})
export class Field {
  readonly label = input<string>('');
  readonly isInvalid = input<boolean>(false);

}

import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Field } from '../../../shared/field/field';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-brand-form',
  imports: [Field, ReactiveFormsModule],
  templateUrl: './brand-form.html',
  styleUrl: './brand-form.css',
})
export class BrandForm {
  @Input() selectedBrand: any = null;
  @Input() modalTitle: string = 'Brand Form';

  @Output() submitForm = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  @Output() formReset = new EventEmitter<void>();

  fb = inject(NonNullableFormBuilder);
  isSubmitted = false;

  form = this.fb.group({
    name: ['', [Validators.required]]
  });

  ngOnChanges() {
    if (this.selectedBrand) {
      this.form.patchValue({
        name: this.selectedBrand?.name
      });
    }
  }

  getControl(controlName: string): FormControl {
    return this.form.get(controlName) as FormControl;
  }

  onSubmit(event: Event) {
    this.isSubmitted = true;
    if (this.form.valid) {
      this.submitForm.emit(this.form.value);
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  onFormReset(event: Event) {
    event.preventDefault();
    this.form.reset({
      name: ''
    });
    this.isSubmitted = false;
    this.formReset.emit();
  }


}

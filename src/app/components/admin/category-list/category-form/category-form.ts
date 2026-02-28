import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Field } from '../../../shared/field/field';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-category-form',
  imports: [Field, ReactiveFormsModule],
  templateUrl: './category-form.html',
  styleUrl: './category-form.css',
})
export class CategoryForm {
  @Input() selectedCategory: any = null;
  @Input() modalTitle: string = 'Category Form';

  @Output() submitForm = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  @Output() formReset = new EventEmitter<void>();

  fb = inject(NonNullableFormBuilder);
  isSubmitted = false;

  form = this.fb.group({
    name: ['', [Validators.required]],
    image: ['']
  });

  ngOnChanges() {
    if (this.selectedCategory) {
      this.form.patchValue({
        name: this.selectedCategory?.name,
        image: this.selectedCategory?.image
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
      name: '',
      image: ''
    });
    this.isSubmitted = false;
    this.formReset.emit();
  }

}

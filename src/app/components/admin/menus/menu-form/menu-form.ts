import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Field } from '../../../shared/field/field';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-menu-form',
  imports: [Field, ReactiveFormsModule],
  templateUrl: './menu-form.html',
  styleUrl: './menu-form.css',
})
export class MenuForm {
  @Input() menuOptions: any[] = [];
  @Input() selectedMenu: any = null;
  @Input() modalTitle: string = 'Menu Form';
  @Input() options: string[] = ['View', 'Insert', 'Edit', 'Delete'];

  @Output() submitForm = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  @Output() formReset = new EventEmitter<void>();

  fb = inject(NonNullableFormBuilder);
  isSubmitted = false;

  form = this.fb.group({
    menuName: ['', [Validators.required]],
    moduleName: [''],
    parentMenuId: [null],
    url: [''],
    isActive: [true],
    icon: [''],
    permissionsKey: [''],
  });

  ngOnChanges() {
    if (this.selectedMenu) {
      this.form.patchValue({
        menuName: this.selectedMenu?.menuName,
        moduleName: this.selectedMenu?.moduleName,
        parentMenuId: this.selectedMenu?.parentMenuId,
        url: this.selectedMenu?.url,
        isActive: this.selectedMenu?.isActive,
        icon: this.selectedMenu?.icon,
        permissionsKey: this.selectedMenu?.permissionsKey,
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
      menuName: '',
      moduleName: '',
      parentMenuId: null,
      url: '',
      isActive: true,
      icon: '',
      permissionsKey: '',
    });
    this.isSubmitted = false;
    this.formReset.emit();
  }

}

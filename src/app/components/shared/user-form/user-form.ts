import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { Field } from '../field/field';
import { FormsModule } from '@angular/forms';
import { form, FormField, required, validate, debounce } from '@angular/forms/signals';

@Component({
  selector: 'app-user-form',
  imports: [Field, FormsModule, FormField],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css',
})
export class UserForm {
  @Input() selectedUser: any = null;
  @Input() modalTitle: string = 'User Form';

  @Output() submitForm = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  @Output() formReset = new EventEmitter<void>();

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    userName: '',
    password: '',
    eId: null as number | null,
    isActive: true,
    menuPermissions: [''] as string[],
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.userName, { message: 'Username is required' });

    validate(schemaPath.userName, ({ value }) => {
      if (value() && value().length < 3) {
        return { kind: 'minLength', message: 'Username must be at least 3 characters' };
      }
      if (value() && value().length > 30) {
        return { kind: 'maxLength', message: 'Username must be less than 30 characters' };
      }
      return null;
    });

    validate(schemaPath.password, ({ value }) => {
      if (value() && value().length < 6) {
        return { kind: 'minLength', message: 'Password must be at least 6 characters' };
      }
      if (value() && value().length > 50) {
        return { kind: 'maxLength', message: 'Password must be less than 50 characters' };
      }
      return null;
    });

    debounce(schemaPath.userName, 300);
    debounce(schemaPath.password, 300);
  });

  ngOnChanges() {
    if (this.selectedUser) {
      this.model.set({
        userName: this.selectedUser?.userName ?? '',
        password: this.selectedUser?.password ?? '',
        eId: this.selectedUser?.eId ?? null,
        isActive: this.selectedUser?.isActive ?? true,
        menuPermissions: this.selectedUser?.menuPermissions ?? [''],
      });
    }
  }

  onSubmit(event: Event) {
    if (!this.form().valid()) {
      return;
    }
    this.submitForm.emit(this.form().value());
  }

  onCancel() {
    this.cancel.emit();
  }

  onFormReset(event: Event) {
    event.preventDefault();
    this.model.set({
      userName: '',
      password: '',
      eId: null,
      isActive: true,
      menuPermissions: [''],
    });
    this.form().reset();
    this.formReset.emit();
  }

}

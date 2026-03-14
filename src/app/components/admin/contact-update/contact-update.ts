import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { FormField, form, required, validate } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { SContact } from '../../../services/s-contact';
import { SPermission } from '../../../services/s-permission';
import { SToast } from '../../../utils/toast/toast.service';
import { ContactM } from '../../../models/Contact';

@Component({
  selector: 'app-contact-update',
  imports: [CommonModule, FontAwesomeModule, FormField, FormsModule],
  templateUrl: './contact-update.html',
  styleUrl: './contact-update.css',
})
export class ContactUpdate {
  faSave = faSave;
  faTimes = faTimes;

  /* ---------------- DI ---------------- */
  private contactService = inject(SContact);
  private permissionService = inject(SPermission);
  private toast = inject(SToast);

  /* ---------------- SIGNAL STATE ---------------- */
  contactData = signal<ContactM | null>(null);

  isLoading = signal(false);
  hasError = signal(false);
  isSubmitted = signal(false);

  isView = signal(false);
  isEdit = signal(false);

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    companyID: environment.companyCode.toString(),
    address1: '',
    address2: '',
    phoneNumber1: '',
    phoneNumber2: '',
    phoneNumber3: '',
    email: '',
    facebookLink: '',
    othersLink1: '',
    othersLink2: '',
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.address1, { message: 'Address 1 is required' });
    required(schemaPath.phoneNumber1, { message: 'Phone Number 1 is required' });
    // required(schemaPath.email, { message: 'Email is required' });
    // validate(schemaPath.email, ({ value }) => {
    //   if (value() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value())) {
    //     return {
    //       kind: 'email',
    //       message: 'Please enter a valid email address'
    //     }
    //   }
    //   return null;
    // });
  });

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit(): void {
    this.loadPermissions();
    this.loadContactData();
  }

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('Contact', 'view'));
    this.isEdit.set(this.permissionService.hasPermission('Contact', 'edit'));
  }

  loadContactData() {
    if (!this.isView()) return;

    this.isLoading.set(true);
    this.hasError.set(false);

    this.contactService.get(environment.companyCode).subscribe({
      next: (data) => {
        this.contactData.set(data);
        this.updateForm(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  updateForm(data: ContactM) {
    this.model.update(current => ({
      ...current,
      address1: data.address1 || '',
      address2: data.address2 || '',
      phoneNumber1: data.phoneNumber1 || '',
      phoneNumber2: data.phoneNumber2 || '',
      phoneNumber3: data.phoneNumber3 || '',
      email: data.email || '',
      facebookLink: data.facebookLink || '',
      othersLink1: data.othersLink1 || '',
      othersLink2: data.othersLink2 || '',
      companyID: data.companyID?.toString() || environment.companyCode.toString(),
    }));
  }

  /* ---------------- SUBMIT ---------------- */
  onSubmit(event: Event) {
    console.log("clicked");
    event.preventDefault();

    if (!this.form().valid()) {
      this.toast.warning('Form is Invalid!', 'bottom-right', 5000);
      return;
    }

    this.isSubmitted.set(true);

    const formValue = this.form().value();

    const payload = {
      companyID: Number(formValue.companyID),
      address1: formValue.address1,
      address2: formValue.address2,
      phoneNumber1: formValue.phoneNumber1,
      phoneNumber2: formValue.phoneNumber2,
      phoneNumber3: formValue.phoneNumber3,
      email: formValue.email,
      facebookLink: formValue.facebookLink,
      othersLink1: formValue.othersLink1,
      othersLink2: formValue.othersLink2,
    };

    const id = this.contactData()?.id?.toString() || environment.companyCode.toString();

    this.contactService.update(id, payload).subscribe({
      next: (response) => {
        this.contactData.set(response);
        this.updateForm(response);
        this.isSubmitted.set(false);
        this.toast.success('Contact information updated successfully!', 'bottom-right', 5000);
      },
      error: (error) => {
        console.error('Error updating contact:', error);
        this.isSubmitted.set(false);
        this.toast.danger('Failed to update contact information. Please try again.', 'bottom-right', 5000);
      }
    });
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    // Reset to original data
    if (this.contactData()) {
      this.updateForm(this.contactData()!);
    }

    this.isSubmitted.set(false);
  }

}

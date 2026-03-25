import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Field } from '../../../shared/field/field';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-settings-form',
  imports: [Field, ReactiveFormsModule],
  templateUrl: './settings-form.html',
  styleUrl: './settings-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsForm {
  @Input() siteSettings: any;
  @Output() submitForm = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  isSubmitted = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      companyName: ['', Validators.required],
      contactPhone: ['', Validators.required],
      address1: ['', Validators.required],
      address2: [''],
      socialLinks: this.fb.group({
        facebook: [''],
        twitter: [''],
        instagram: [''],
        linkedin: ['']
      }),
      deliveryCharges: this.fb.array([])
    });
  }

  get socialLinksGroup(): FormGroup {
    return this.form.get('socialLinks') as FormGroup;
  }

  ngOnChanges() {
    if (this.siteSettings) {
      this.form.patchValue({
        companyName: this.siteSettings.companyName,
        contactPhone: this.siteSettings.contactPhone,
        address1: this.siteSettings.address1,
        address2: this.siteSettings.address2 || '',
        socialLinks: {
          facebook: this.siteSettings.socialLinks?.facebook || '',
          twitter: this.siteSettings.socialLinks?.twitter || '',
          instagram: this.siteSettings.socialLinks?.instagram || '',
          linkedin: this.siteSettings.socialLinks?.linkedin || ''
        }
      });

      this.clearDeliveryCharges();

      if (this.siteSettings.deliveryCharges?.length) {
        this.siteSettings.deliveryCharges.forEach((charge: any) => {
          this.addDeliveryCharge(charge);
        });
      }
    }
  }

  get deliveryCharges(): FormArray {
    return this.form.get('deliveryCharges') as FormArray;
  }

  private clearDeliveryCharges(): void {
    while (this.deliveryCharges.length !== 0) {
      this.deliveryCharges.removeAt(0);
    }
  }

  private addDeliveryCharge(charge?: any): void {
    this.deliveryCharges.push(this.fb.group({
      id: [charge?.id || 0],
      name: [charge?.name || '', Validators.required],
      amount: [charge?.amount || 0, [Validators.required, Validators.min(0)]],
      isActive: [charge?.isActive || false]
    }));
  }

  trackByDeliveryCharge(index: number, item: AbstractControl): number {
    return index;
  }

  onStatusChange(index: number) {
    const chargeGroup = this.deliveryCharges.at(index) as FormGroup;
    const currentValue = chargeGroup.get('isActive')?.value;
    chargeGroup.get('isActive')?.setValue(!currentValue);
  }

  isFieldInvalid(fieldPath: string): boolean {
    const field = this.form.get(fieldPath);
    return !!field && field.invalid && (field.touched || this.isSubmitted);
  }

  isDeliveryChargeFieldInvalid(index: number, fieldName: string): boolean {
    const chargeGroup = this.deliveryCharges.at(index) as FormGroup;
    const field = chargeGroup.get(fieldName);
    return !!field && field.invalid && (field.touched || this.isSubmitted);
  }

  getDeliveryChargeControl(index: number, controlName: string): FormControl {
    const deliveryChargeGroup = this.deliveryCharges.at(index) as FormGroup;
    return deliveryChargeGroup.get(controlName) as FormControl;
  }

  onSubmit() {
    this.isSubmitted = true;
    if (this.form.valid) {
      this.submitForm.emit(this.form.value);
    }
  }

  onCancel() {
    this.cancel.emit();
  }

}

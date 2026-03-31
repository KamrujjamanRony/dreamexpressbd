import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { FormField, form } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSave, faTimes, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { SContact } from '../../../services/s-contact';
import { SPermission } from '../../../services/s-permission';
import { SToast } from '../../../utils/toast/toast.service';
import { ContactM, DeliveryChargeM, QuickInfoM, FaqM, ContactCardM } from '../../../models/Contact';
import { QuillEditorComponent } from 'ngx-quill';

@Component({
  selector: 'app-contact-update',
  imports: [CommonModule, FontAwesomeModule, FormField, FormsModule, QuillEditorComponent],
  templateUrl: './contact-update.html',
  styleUrl: './contact-update.css',
})
export class ContactUpdate {
  faSave = faSave;
  faTimes = faTimes;
  faPlus = faPlus;
  faTrash = faTrash;

  /* ---------------- DI ---------------- */
  private contactService = inject(SContact);
  private permissionService = inject(SPermission);
  private toast = inject(SToast);

  /* ---------------- SIGNAL STATE ---------------- */
  contactData = signal<ContactM | null>(null);
  deliveryCharges = signal<DeliveryChargeM[]>([]);
  quickInfoList = signal<QuickInfoM[]>([]);
  faqsList = signal<FaqM[]>([]);
  contactCardsList = signal<ContactCardM[]>([]);

  activeTab = signal<'general' | 'quickInfo' | 'faqs' | 'contactCards' | 'delivery'>('general');

  // New item forms
  newChargeName = '';
  newChargeAmount: number | null = null;

  // Edit charge
  editingChargeIndex = signal<number | null>(null);
  editChargeName = '';
  editChargeAmount: number | null = null;

  isLoading = signal(false);
  hasError = signal(false);
  isSubmitted = signal(false);

  isView = signal(false);
  isEdit = signal(false);

  /* ---------------- Rich Text Editor ---------------- */
  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'direction': 'rtl' }],
      ['clean']
    ]
  };

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    companyID: environment.companyCode.toString(),
    facebookLink: '',
    iLink: '',
    yLink: '',
    wNum: '',
    lat: '0',
    lng: '0',
    mapUrl: '',
    othersLink1: '',
    othersLink2: '',
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model);

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
        this.deliveryCharges.set(data.deliveryCharges || []);
        this.quickInfoList.set(data.quickInfo || []);
        this.faqsList.set(data.faqs || []);
        this.contactCardsList.set(data.contactCards || []);
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
      facebookLink: data.facebookLink || '',
      iLink: data.iLink || '',
      yLink: data.yLink || '',
      wNum: data.wNum || '',
      lat: String(data.lat || 0),
      lng: String(data.lng || 0),
      mapUrl: data.mapUrl || '',
      othersLink1: data.othersLink1 || '',
      othersLink2: data.othersLink2 || '',
      companyID: data.companyID?.toString() || environment.companyCode.toString(),
    }));
  }

  /* ---------------- SUBMIT ---------------- */
  onSubmit(event: Event) {
    event.preventDefault();

    if (!this.form().valid()) {
      this.toast.warning('Form is Invalid!', 'bottom-right', 5000);
      return;
    }

    this.isSubmitted.set(true);

    const formValue = this.form().value();

    const payload = {
      companyID: Number(formValue.companyID),
      facebookLink: formValue.facebookLink,
      iLink: formValue.iLink,
      yLink: formValue.yLink,
      wNum: formValue.wNum,
      lat: Number(formValue.lat),
      lng: Number(formValue.lng),
      mapUrl: formValue.mapUrl,
      othersLink1: formValue.othersLink1,
      othersLink2: formValue.othersLink2,
      quickInfo: this.quickInfoList(),
      faqs: this.faqsList(),
      contactCards: this.contactCardsList(),
      deliveryCharges: this.deliveryCharges(),
    };

    const id = this.contactData()?.id?.toString() || environment.companyCode.toString();

    this.contactService.update(id, payload).subscribe({
      next: (response) => {
        this.contactData.set(response);
        this.deliveryCharges.set(response.deliveryCharges || []);
        this.quickInfoList.set(response.quickInfo || []);
        this.faqsList.set(response.faqs || []);
        this.contactCardsList.set(response.contactCards || []);
        this.updateForm(response);
        this.isSubmitted.set(false);
        this.toast.success('Contact information updated successfully!', 'bottom-right', 5000);
      },
      error: (error) => {
        console.error('Error updating contact:', error);
        this.isSubmitted.set(false);
        this.toast.danger(error?.error || 'Failed to update contact information.', 'bottom-right', 5000);
      }
    });
  }

  /* ---------------- QUICK INFO ---------------- */
  addQuickInfo() {
    this.quickInfoList.update(list => [...list, { title: '', description: '', icon: '' }]);
  }

  removeQuickInfo(index: number) {
    this.quickInfoList.update(list => list.filter((_, i) => i !== index));
  }

  updateQuickInfo(index: number, field: keyof QuickInfoM, value: string) {
    this.quickInfoList.update(list =>
      list.map((item, i) => i === index ? { ...item, [field]: value } : item)
    );
  }

  /* ---------------- FAQS ---------------- */
  addFaq() {
    this.faqsList.update(list => [...list, { question: '', answer: '' }]);
  }

  removeFaq(index: number) {
    this.faqsList.update(list => list.filter((_, i) => i !== index));
  }

  updateFaq(index: number, field: keyof FaqM, value: string) {
    this.faqsList.update(list =>
      list.map((item, i) => i === index ? { ...item, [field]: value } : item)
    );
  }

  /* ---------------- CONTACT CARDS ---------------- */
  addContactCard() {
    this.contactCardsList.update(list => [...list, { type: '', title: '', value: '' }]);
  }

  removeContactCard(index: number) {
    this.contactCardsList.update(list => list.filter((_, i) => i !== index));
  }

  updateContactCard(index: number, field: keyof ContactCardM, value: string) {
    this.contactCardsList.update(list =>
      list.map((item, i) => i === index ? { ...item, [field]: value } : item)
    );
  }

  /* ---------------- DELIVERY CHARGES ---------------- */
  addDeliveryCharge() {
    const name = this.newChargeName.trim();
    const amount = this.newChargeAmount;
    if (!name || amount === null || amount < 0) {
      this.toast.warning('Please enter a valid name and amount', 'bottom-right', 3000);
      return;
    }
    this.deliveryCharges.update(list => [
      ...list,
      { name, amount, isActive: true }
    ]);
    this.newChargeName = '';
    this.newChargeAmount = null;
  }

  removeDeliveryCharge(index: number) {
    this.deliveryCharges.update(list => list.filter((_, i) => i !== index));
    if (this.editingChargeIndex() === index) this.cancelEditCharge();
  }

  startEditCharge(index: number) {
    const charge = this.deliveryCharges()[index];
    this.editingChargeIndex.set(index);
    this.editChargeName = charge.name;
    this.editChargeAmount = charge.amount;
  }

  saveEditCharge() {
    const index = this.editingChargeIndex();
    const name = this.editChargeName.trim();
    const amount = this.editChargeAmount;
    if (index === null || !name || amount === null || amount < 0) {
      this.toast.warning('Please enter a valid name and amount', 'bottom-right', 3000);
      return;
    }
    this.deliveryCharges.update(list =>
      list.map((c, i) => i === index ? { ...c, name, amount } : c)
    );
    this.cancelEditCharge();
  }

  cancelEditCharge() {
    this.editingChargeIndex.set(null);
    this.editChargeName = '';
    this.editChargeAmount = null;
  }

  toggleChargeActive(index: number) {
    this.deliveryCharges.update(list =>
      list.map((c, i) => i === index ? { ...c, isActive: !c.isActive } : c)
    );
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    if (this.contactData()) {
      this.updateForm(this.contactData()!);
      this.deliveryCharges.set(this.contactData()!.deliveryCharges || []);
      this.quickInfoList.set(this.contactData()!.quickInfo || []);
      this.faqsList.set(this.contactData()!.faqs || []);
      this.contactCardsList.set(this.contactData()!.contactCards || []);
    }

    this.newChargeName = '';
    this.newChargeAmount = null;
    this.isSubmitted.set(false);
  }

}

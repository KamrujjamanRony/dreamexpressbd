import { Component, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { FormField, form, required } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { AboutUsM } from '../../../models/AboutUs';
import { SAbout } from '../../../services/s-about';
import { SPermission } from '../../../services/s-permission';
import { SToast } from '../../../utils/toast/toast.service';
import { QuillEditorComponent } from 'ngx-quill';

@Component({
  selector: 'app-about-update',
  imports: [CommonModule, FontAwesomeModule, FormField, FormsModule, QuillEditorComponent],
  templateUrl: './about-update.html',
  styleUrl: './about-update.css',
})
export class AboutUpdate {
  faSave = faSave;
  faTimes = faTimes;

  /* ---------------- DI ---------------- */
  private aboutService = inject(SAbout);
  private permissionService = inject(SPermission);
  private toast = inject(SToast);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  /* ---------------- SIGNAL STATE ---------------- */
  aboutData = signal<AboutUsM | null>(null);
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);

  isLoading = signal(false);
  hasError = signal(false);
  isSubmitted = signal(false);

  isView = signal(false);
  isEdit = signal(false);

  /* ---------------- Rich Text Editor ---------------- */
  editorDescription = '';
  editorDescription2 = '';
  editorDescription3 = '';
  editorDescription4 = '';
  editorDescription5 = '';

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'header': [1, 2, 3, false] }],
      ['clean']
    ]
  };

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    companyID: environment.companyCode.toString(),
    heading: '',
    title: '',
    description: '',
    title2: '',
    description2: '',
    title3: '',
    description3: '',
    title4: '',
    description4: '',
    title5: '',
    description5: '',
    title6: '',
    description6: '',
    title7: '',
    description7: '',
    title8: '',
    description8: '',
    imageFile: '',
    imageUrl: '',
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.heading, { message: 'Heading is required' });
    required(schemaPath.title, { message: 'Title is required' });
    required(schemaPath.description, { message: 'Description is required' });
  });

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit(): void {
    this.loadPermissions();
    this.loadAboutData();
  }

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('About', 'view'));
    this.isEdit.set(this.permissionService.hasPermission('About', 'edit'));
  }

  loadAboutData() {
    if (!this.isView()) return;

    this.isLoading.set(true);
    this.hasError.set(false);

    this.aboutService.get(environment.companyCode).subscribe({
      next: (data) => {
        this.aboutData.set(data);
        this.updateForm(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  updateForm(data: AboutUsM) {
    this.model.update(current => ({
      ...current,
      heading: data.heading || '',
      title: data.title || '',
      description: data.description || '',
      title2: data.title2 || '',
      description2: data.description2 || '',
      title3: data.title3 || '',
      description3: data.description3 || '',
      title4: data.title4 || '',
      description4: data.description4 || '',
      title5: data.title5 || '',
      description5: data.description5 || '',
      title6: data.title6 || '',
      description6: data.description6 || '',
      title7: data.title7 || '',
      description7: data.description7 || '',
      title8: data.title8 || '',
      description8: data.description8 || '',
      imageUrl: data.imageUrl || '',
      companyID: data.companyID?.toString() || environment.companyCode.toString(),
    }));

    // Sync editor properties
    this.editorDescription = data.description || '';
    this.editorDescription2 = data.description2 || '';
    this.editorDescription3 = data.description3 || '';
    this.editorDescription4 = data.description4 || '';
    this.editorDescription5 = data.description5 || '';

    // Set preview image if exists
    if (data.imageUrl) {
      this.previewUrl.set(
        environment.ImageApi ? `${environment.ImageApi}${data.imageUrl}` : data.imageUrl
      );
    }
  }

  /* ---------------- Image File Handler ---------------- */
  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile.set(file);

      const reader = new FileReader();
      reader.onload = () => this.previewUrl.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  clearFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  /* ---------------- SUBMIT ---------------- */
  onSubmit(event: Event) {
    event.preventDefault();

    // Sync editor values to model before validation
    this.model.update(m => ({
      ...m,
      description: this.editorDescription,
      description2: this.editorDescription2,
      description3: this.editorDescription3,
      description4: this.editorDescription4,
      description5: this.editorDescription5,
    }));

    if (!this.form().valid()) {
      this.toast.warning('Please fill all required fields!', 'bottom-right', 5000);
      return;
    }

    this.isSubmitted.set(true);

    const formValue = this.form().value();

    const payload = {
      companyID: Number(formValue.companyID),
      heading: formValue.heading,
      title: formValue.title,
      description: formValue.description,
      title2: formValue.title2,
      description2: formValue.description2,
      title3: formValue.title3,
      description3: formValue.description3,
      title4: formValue.title4,
      description4: formValue.description4,
      title5: formValue.title5,
      description5: formValue.description5,
      title6: formValue.title6,
      description6: formValue.description6,
      title7: formValue.title7,
      description7: formValue.description7,
      title8: formValue.title8,
      description8: formValue.description8,
    };

    const formData = new FormData();

    // Append all text fields
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // Append image file if selected
    if (this.selectedFile()) {
      formData.append('ImageFile', this.selectedFile() as File);
    } else if (formValue.imageUrl) {
      // If no new file but imageUrl exists, keep the existing one
      formData.append('ImageUrl', formValue.imageUrl);
    }

    const id = this.aboutData()?.id?.toString() || environment.companyCode.toString();

    this.aboutService.update(id, formData).subscribe({
      next: (response) => {
        this.aboutData.set(response);
        this.updateForm(response);
        this.isSubmitted.set(false);

        this.toast.success('Saved successfully!', 'bottom-right', 5000);
      },
      error: (error) => {
        console.error('Error updating about:', error);
        this.isSubmitted.set(false);
        this.toast.danger(error?.error || 'Failed to update about information. Please try again.', 'bottom-right', 5000);
      }
    });
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    // Reset to original data
    if (this.aboutData()) {
      this.updateForm(this.aboutData()!);
    }
    this.selectedFile.set(null);
    this.isSubmitted.set(false);
    this.clearFileInput();
    this.previewUrl.set(null);
  }

}

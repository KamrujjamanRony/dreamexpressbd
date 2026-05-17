// carousel-list.ts
import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass, faTrash } from '@fortawesome/free-solid-svg-icons';
import { form, FormField } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment.production';
import { SPermission } from '../../../services/s-permission';
import { SToast } from '../../../utils/toast/toast.service';
import { SConfirm } from '../../../utils/confirm/confirm.service';
import { CarouselM } from '../../../models/Carousel';
import { SCarousel } from '../../../services/s-carousel';
import { QuillEditorComponent } from 'ngx-quill';
import { GalleryPicker } from '../../shared/gallery-picker/gallery-picker';

@Component({
  selector: 'app-carousel-list',
  imports: [CommonModule, FontAwesomeModule, FormField, FormsModule, QuillEditorComponent, GalleryPicker],
  templateUrl: './carousel-list.html',
  styleUrl: './carousel-list.css',
})
export class CarouselList {
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;
  faTrash = faTrash;

  /* ---------------- DI ---------------- */
  private carouselService = inject(SCarousel);
  private permissionService = inject(SPermission);
  private toast = inject(SToast);
  private confirm = inject(SConfirm);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  imgURL = environment.ImageApi;
  emptyImg = environment.emptyImg;

  /* ---------------- SIGNAL STATE ---------------- */
  carousels = signal<CarouselM[]>([]);
  searchQuery = signal('');

  filteredList = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.carousels()
      .filter(carousel =>
        carousel.title?.toLowerCase().includes(query) ||
        carousel.description?.toLowerCase().includes(query)
      )
      .reverse();
  });

  selected = signal<CarouselM | null>(null);

  // Gallery selection
  selectedGalleryId = signal<string>('');
  selectedGalleryUrl = signal<string>('');

  isLoading = signal(false);
  hasError = signal(false);

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);

  isSubmitted = signal(false);
  showList = signal(true);

  /* ---------------- Rich Text Editor ---------------- */
  editorDescription = '';

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
    title: '',
    description: '',
    bLink: '',
    companyID: environment.companyCode,
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    // required(schemaPath.title, { message: 'Title is required' });

    // validate(schemaPath.description, ({ value }) => {
    //   if (!value()) {
    //     return {
    //       kind: 'required',
    //       message: 'Description is required'
    //     }
    //   }
    //   return null;
    // });

    // debounce(schemaPath.title, 300);
  });

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit(): void {
    this.loadCarousels();
    this.loadPermissions();
  }

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('Carousel', 'view'));
    this.isInsert.set(this.permissionService.hasPermission('Carousel', 'create'));
    this.isEdit.set(this.permissionService.hasPermission('Carousel', 'edit'));
    this.isDelete.set(this.permissionService.hasPermission('Carousel', 'delete'));
  }

  loadCarousels() {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.carouselService.search().subscribe({
      next: (data) => {
        this.carousels.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  /* ---------------- SEARCH ---------------- */
  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value.trim());
  }

  /* ---------------- GALLERY PICKER ---------------- */
  onGalleryPicked(event: { id: string; imageUrl: string }) {
    this.selectedGalleryId.set(event.id);
    this.selectedGalleryUrl.set(event.imageUrl);
  }

  clearGalleryImage() {
    this.selectedGalleryId.set('');
    this.selectedGalleryUrl.set('');
  }

  /* ---------------- SUBMIT ---------------- */
  onSubmit(event: Event) {
    event.preventDefault();

    // Sync editor values to model before validation
    this.model.update(m => ({
      ...m,
      description: this.editorDescription,
    }));

    if (!this.form().valid()) {
      this.toast.warning('Please fill all required fields!', 'bottom-right', 5000);
      return;
    }

    // Check if image is selected for new items
    if (!this.selected() && !this.selectedGalleryId()) {
      this.toast.warning('Please select an image!', 'bottom-right', 5000);
      return;
    }

    this.isSubmitted.set(true);

    const formValue = this.form().value();
    const body: any = {
      companyID: formValue.companyID,
      title: formValue.title || '',
      description: formValue.description || '',
      bLink: formValue.bLink || '',
    };

    if (this.selectedGalleryId()) {
      body.galleryId = this.selectedGalleryId();
    }

    const request$ = this.selected()
      ? this.carouselService.update(this.selected()!.id, body)
      : this.carouselService.add(body);

    request$.subscribe({
      next: (response) => {
        this.loadCarousels();
        this.onToggleList();
        this.toast.success('Saved successfully!', 'bottom-right', 5000);
        this.isSubmitted.set(false);
      },
      error: (error) => {
        this.isSubmitted.set(false);
        console.error('Error:', error);
        this.toast.danger(
          error?.error || 'Save unsuccessful!',
          'top-left',
          3000
        );
      }
    });
  }

  /* ---------------- UPDATE ---------------- */
  onUpdate(carousel: CarouselM) {
    this.selected.set(carousel);

    this.model.update(current => ({
      ...current,
      title: carousel.title,
      description: carousel.description || '',
      bLink: carousel.bLink || '',
      companyID: carousel.companyID,
    }));

    // Sync editor property
    this.editorDescription = carousel.description || '';

    this.form().reset();

    // Set gallery image if linked
    if (carousel.galleryId) {
      this.selectedGalleryId.set(carousel.galleryId);
      this.selectedGalleryUrl.set(carousel.imageUrl || '');
    } else {
      this.selectedGalleryId.set('');
      this.selectedGalleryUrl.set(carousel.imageUrl || '');
    }

    this.showList.set(false);
  }

  /* ---------------- DELETE ---------------- */
  async onDelete(id: any) {
    const ok = await this.confirm.confirm({
      message: 'Are you sure you want to delete this Carousel?',
      confirmText: "Yes, I'm sure",
      cancelText: 'No, cancel',
      variant: 'danger',
    });

    if (ok) {
      this.carouselService.delete(id).subscribe({
        next: () => {
          this.carousels.update(list => list.filter(c => c.id !== id));
          this.toast.success('Carousel deleted successfully!', 'bottom-right', 5000);
        },
        error: (error) => {
          this.toast.danger(
            error?.error || 'Delete unsuccessful!',
            'top-left',
            3000
          );
          console.error('Error deleting Carousel:', error);
        }
      });
    }
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    this.model.set({
      title: '',
      description: '',
      bLink: '',
      companyID: environment.companyCode,
    });

    this.selected.set(null);
    this.selectedGalleryId.set('');
    this.selectedGalleryUrl.set('');
    this.isSubmitted.set(false);

    // Reset editor value
    this.editorDescription = '';

    this.form().reset();
  }

  onToggleList() {
    this.showList.update(s => !s);
    this.formReset();
  }

}

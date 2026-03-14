// carousel-list.ts
import { CommonModule, IMAGE_LOADER, ImageLoaderConfig, NgOptimizedImage } from '@angular/common';
import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass, faTrash } from '@fortawesome/free-solid-svg-icons';
import { form, FormField } from '@angular/forms/signals';
import { environment } from '../../../../environments/environment.production';
import { SPermission } from '../../../services/s-permission';
import { SToast } from '../../../utils/toast/toast.service';
import { SConfirm } from '../../../utils/confirm/confirm.service';
import { CarouselM } from '../../../models/Carousel';
import { SCarousel } from '../../../services/s-carousel';

@Component({
  selector: 'app-carousel-list',
  imports: [CommonModule, FontAwesomeModule, FormField, NgOptimizedImage],
  templateUrl: './carousel-list.html',
  styleUrl: './carousel-list.css',
  providers: [
    {
      provide: IMAGE_LOADER,
      useValue: (config: ImageLoaderConfig) => {
        return `${environment.ImageApi + config.src}?w=${config.width}`;
      },
    },
  ],
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
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  
  imgURL = environment.ImageApi;
  emptyImg = environment.emptyImg;

  /* ---------------- SIGNAL STATE ---------------- */
  carousels = signal<CarouselM[]>([]);
  searchQuery = signal('');

  filteredList = computed(() => {
    const query = this.searchQuery().toLowerCase();
    console.log(this.carousels());
    console.log(this.carousels()
      .filter(carousel =>
        carousel.title?.toLowerCase().includes(query) ||
        carousel.description?.toLowerCase().includes(query)
      ));

    return this.carousels()
      .filter(carousel =>
        carousel.title?.toLowerCase().includes(query) ||
        carousel.description?.toLowerCase().includes(query)
      )
      .reverse();
  });

  selected = signal<CarouselM | null>(null);
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);

  isLoading = signal(false);
  hasError = signal(false);

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);

  isSubmitted = signal(false);
  showList = signal(true);

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    title: '',
    description: '',
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

  /* ---------------- Image File Handler ---------------- */
  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.toast.warning('Please select an image file', 'bottom-right', 5000);
        this.clearFileInput();
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toast.warning('Image size should be less than 5MB', 'bottom-right', 5000);
        this.clearFileInput();
        return;
      }

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
    this.selectedFile.set(null);
  }

  removeImage() {
    this.previewUrl.set(null);
    this.selectedFile.set(null);
    this.clearFileInput();
  }

  /* ---------------- SUBMIT ---------------- */
  onSubmit(event: Event) {
    event.preventDefault();

    if (!this.form().valid()) {
      this.toast.warning('Please fill all required fields!', 'bottom-right', 5000);
      return;
    }

    // Check if image is selected for new items
    if (!this.selected() && !this.selectedFile()) {
      this.toast.warning('Please select an image!', 'bottom-right', 5000);
      return;
    }

    this.isSubmitted.set(true);

    const formValue = this.form().value();
    const formData = new FormData();

    formData.append('CompanyID', String(formValue.companyID));
    formData.append('Title', formValue.title || '');
    formData.append('Description', formValue.description || '');

    // Append file if selected
    if (this.selectedFile()) {
      formData.append('ImageFile', this.selectedFile() as File);
    }

    const request$ = this.selected()
      ? this.carouselService.update(this.selected()!.id, formData)
      : this.carouselService.add(formData);

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
          error?.error?.message || 'Save unsuccessful!', 
          'bottom-left', 
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
      companyID: carousel.companyID,
    }));

    this.form().reset();
    
    // Set main image preview
    if (carousel.imageUrl) {
      this.previewUrl.set(
        this.imgURL ? `${this.imgURL}${carousel.imageUrl}` : carousel.imageUrl
      );
    } else {
      this.previewUrl.set(null);
    }

    this.selectedFile.set(null);
    this.clearFileInput();
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
            error?.error?.message || 'Delete unsuccessful!', 
            'bottom-left', 
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
      companyID: environment.companyCode,
    });

    this.selected.set(null);
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.isSubmitted.set(false);

    this.form().reset();
    this.clearFileInput();
  }

  onToggleList() {
    this.showList.update(s => !s);
    this.formReset();
  }

}

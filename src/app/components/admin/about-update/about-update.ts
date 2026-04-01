import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSave, faTimes, faPlus, faTrash, faImage, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AboutUsM, AboutUsInfoM } from '../../../models/AboutUs';
import { GalleryM } from '../../../models/Gallery';
import { SAbout } from '../../../services/s-about';
import { SGallery } from '../../../services/s-gallery';
import { SPermission } from '../../../services/s-permission';
import { SToast } from '../../../utils/toast/toast.service';
import { QuillEditorComponent } from 'ngx-quill';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-about-update',
  imports: [CommonModule, FontAwesomeModule, FormsModule, QuillEditorComponent],
  templateUrl: './about-update.html',
  styleUrl: './about-update.css',
})
export class AboutUpdate {
  faSave = faSave;
  faTimes = faTimes;
  faPlus = faPlus;
  faTrash = faTrash;
  faImage = faImage;
  faXmark = faXmark;

  /* ---------------- DI ---------------- */
  private aboutService = inject(SAbout);
  private galleryService = inject(SGallery);
  private permissionService = inject(SPermission);
  private toast = inject(SToast);

  imgURL = environment.ImageApi;
  emptyImg = environment.emptyImg;

  /* ---------------- SIGNAL STATE ---------------- */
  aboutData = signal<AboutUsM | null>(null);
  galleryImages = signal<GalleryM[]>([]);

  galleryMap = computed(() => {
    const map = new Map<string, string>();
    this.galleryImages().forEach(img => {
      if (img.id) map.set(`galleryId-${img.id}`, img.imageUrl);
    });
    return map;
  });

  isLoading = signal(true);
  hasError = signal(false);
  isSubmitted = signal(false);

  isView = signal(false);
  isEdit = signal(false);

  /* ---------------- Gallery Picker ---------------- */
  showGalleryPicker = signal(false);
  galleryPickerTarget = signal<'main' | number | null>(null);
  galleryFilterType = '';
  galleryTypeOptions = ['Product', 'Carousel', 'Category', 'Brand', 'OrderItem', 'Blog', 'About', 'Contact'];

  /* ---------------- Quill Config ---------------- */
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

  /* ---------------- FORM STATE ---------------- */
  heading = '';
  imageUrl = '';
  infoItems: AboutUsInfoM[] = [];

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit(): void {
    this.loadPermissions();
    this.loadGalleryImages();
    this.loadAboutData();
  }

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('About', 'view'));
    this.isEdit.set(this.permissionService.hasPermission('About', 'edit'));
  }

  loadGalleryImages() {
    this.galleryService.search().subscribe({
      next: (data) => this.galleryImages.set(data),
    });
  }

  loadAboutData() {
    if (!this.isView()) { this.isLoading.set(false); return; }

    this.isLoading.set(true);
    this.hasError.set(false);

    this.aboutService.get(environment.companyCode).subscribe({
      next: (data) => {
        this.aboutData.set(data);
        this.populateForm(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  populateForm(data: AboutUsM) {
    this.heading = data.heading || '';
    this.imageUrl = data.imageUrl || '';
    this.infoItems = (data.info || []).map(i => ({ ...i }));
  }

  /* ---------------- Gallery Resolution ---------------- */
  resolveGalleryUrl(ref: string): string {
    if (!ref) return '';
    const url = this.galleryMap().get(ref);
    return url ? this.imgURL + url : '';
  }

  /* ---------------- Gallery Picker ---------------- */
  openGalleryPicker(target: 'main' | number) {
    this.galleryPickerTarget.set(target);
    this.showGalleryPicker.set(true);
  }

  selectGalleryImage(img: GalleryM) {
    const ref = `galleryId-${img.id}`;
    const target = this.galleryPickerTarget();

    if (target === 'main') {
      this.imageUrl = ref;
    } else if (typeof target === 'number') {
      this.infoItems[target].imgU = ref;
    }
    this.closeGalleryPicker();
  }

  closeGalleryPicker() {
    this.showGalleryPicker.set(false);
    this.galleryPickerTarget.set(null);
  }

  getFilteredGalleryImages(): GalleryM[] {
    const type = this.galleryFilterType;
    if (!type) return this.galleryImages();
    return this.galleryImages().filter(img => img.type === type);
  }

  /* ---------------- Info Management ---------------- */
  addInfoItem() {
    this.infoItems = [...this.infoItems, { title: '', desc: '', imgU: '' }];
  }

  removeInfoItem(index: number) {
    this.infoItems = this.infoItems.filter((_, i) => i !== index);
  }

  /* ---------------- SUBMIT ---------------- */
  onSubmit(event: Event) {
    event.preventDefault();

    if (!this.heading.trim()) {
      this.toast.warning('Please enter a heading!');
      return;
    }

    this.isSubmitted.set(true);

    const payload: Partial<AboutUsM> = {
      companyID: environment.companyCode,
      heading: this.heading,
      imageUrl: this.imageUrl,
      info: this.infoItems,
    };

    const id = this.aboutData()?.id || environment.companyCode;
    const request$ = this.aboutData()?.id
      ? this.aboutService.update(id, payload)
      : this.aboutService.add(payload);

    request$.subscribe({
      next: (response) => {
        this.aboutData.set(response);
        this.populateForm(response);
        this.isSubmitted.set(false);
        this.toast.success('Saved successfully!');
      },
      error: (error) => {
        this.isSubmitted.set(false);
        this.toast.danger(error?.error?.message || error?.error || 'Failed to save. Please try again.');
      }
    });
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    const data = this.aboutData();
    if (data) {
      this.populateForm(data);
    } else {
      this.heading = '';
      this.imageUrl = '';
      this.infoItems = [];
    }
    this.isSubmitted.set(false);
  }
}

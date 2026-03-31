import { Component, computed, inject, input, output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { environment } from '../../../../environments/environment';
import { SGallery } from '../../../services/s-gallery';
import { GalleryM } from '../../../models/Gallery';

@Component({
  selector: 'app-gallery-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './gallery-picker.html',
  styleUrl: './gallery-picker.css',
})
export class GalleryPicker implements OnInit {
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;

  private galleryService = inject(SGallery);
  imgURL = environment.ImageApi;

  /** Gallery type filter passed by parent (e.g. 'Category', 'Carousel') */
  type = input<string>('');

  /** Label shown above the picker field */
  label = input<string>('Image');

  /** Whether the field is required (shows * in label) */
  required = input<boolean>(false);

  /** Currently selected gallery ID (two-way bindable) */
  selectedId = input<string>('');

  /** Currently selected image URL (two-way bindable) */
  selectedUrl = input<string>('');

  /** Emitted when user picks an image */
  imagePicked = output<{ id: string; imageUrl: string }>();

  /** Emitted when user clears the image */
  imageCleared = output<void>();

  /* ---------- Internal State ---------- */
  galleryImages = signal<GalleryM[]>([]);
  isLoading = signal(false);
  showModal = signal(false);
  searchQuery = signal('');

  filteredImages = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const images = this.galleryImages();
    if (!query) return images;
    return images.filter(img =>
      img.description?.toLowerCase().includes(query) ||
      img.type?.toLowerCase().includes(query)
    );
  });

  private preloadedImages: HTMLImageElement[] = [];

  ngOnInit(): void {
    this.loadImages();
  }

  loadImages() {
    this.isLoading.set(true);
    this.galleryService.search(this.type() || undefined).subscribe({
      next: (data) => {
        this.galleryImages.set(data);
        this.preloadAssets(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  openModal() {
    if (!this.galleryImages().length && !this.isLoading()) {
      this.loadImages();
    }
    this.showModal.set(true);
    this.searchQuery.set('');
  }

  closeModal() {
    this.showModal.set(false);
  }

  selectImage(image: GalleryM) {
    this.imagePicked.emit({ id: image.id || '', imageUrl: image.imageUrl || '' });
    this.showModal.set(false);
  }

  clearImage() {
    this.imageCleared.emit();
  }

  private preloadAssets(images: GalleryM[]) {
    this.preloadedImages = [];
    for (const image of images) {
      if (!image?.imageUrl) continue;
      const img = new Image();
      img.decoding = 'sync';
      img.src = this.imgURL + image.imageUrl;
      this.preloadedImages.push(img);
    }
  }
}

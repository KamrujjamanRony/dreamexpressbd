import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment.production';
import { SPermission } from '../../../services/s-permission';
import { SToast } from '../../../utils/toast/toast.service';
import { SConfirm } from '../../../utils/confirm/confirm.service';
import { SGallery } from '../../../services/s-gallery';
import { SAuthUser } from '../../../services/s-auth-user';
import { GalleryM } from '../../../models/Gallery';

@Component({
    selector: 'app-gallery-list',
    imports: [CommonModule, FontAwesomeModule, FormsModule],
    templateUrl: './gallery-list.html',
    styleUrl: './gallery-list.css',
})
export class GalleryList {
    faPencil = faPencil;
    faXmark = faXmark;
    faMagnifyingGlass = faMagnifyingGlass;
    faTrash = faTrash;

    /* ---------------- DI ---------------- */
    private galleryService = inject(SGallery);
    private permissionService = inject(SPermission);
    private authUser = inject(SAuthUser);
    private toast = inject(SToast);
    private confirm = inject(SConfirm);

    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    imgURL = environment.ImageApi;
    emptyImg = environment.emptyImg;

    typeOptions = ['Product', 'Carousel', 'Category', 'Brand', 'OrderItem', 'Blog', 'About', 'Contact'];

    /* ---------------- SIGNAL STATE ---------------- */
    items = signal<GalleryM[]>([]);
    searchQuery = signal('');
    filterType = signal(this.typeOptions[0]);

    filteredList = computed(() => {
        const query = this.searchQuery().toLowerCase();
        const type = this.filterType();

        return this.items()
            .filter(item => {
                const matchesQuery =
                    item.description?.toLowerCase().includes(query) ||
                    item.type?.toLowerCase().includes(query) ||
                    item.postBy?.toLowerCase().includes(query);
                const matchesType = !type || item.type === type;
                return matchesQuery && matchesType;
            })
            .reverse();
    });

    selected = signal<GalleryM | null>(null);
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
    isDragging = signal(false);

    /* ---------------- FORM MODEL ---------------- */
    formType = '';
    formDescription = '';

    /* ---------------- LIFECYCLE ---------------- */
    ngOnInit(): void {
        this.loadItems();
        this.loadPermissions();
    }

    /* ---------------- LOADERS ---------------- */
    loadPermissions() {
        this.isView.set(this.permissionService.hasPermission('ImageGallery', 'view'));
        this.isInsert.set(this.permissionService.hasPermission('ImageGallery', 'create'));
        this.isEdit.set(this.permissionService.hasPermission('ImageGallery', 'edit'));
        this.isDelete.set(this.permissionService.hasPermission('ImageGallery', 'delete'));
    }

    loadItems() {
        this.isLoading.set(true);
        this.hasError.set(false);

        this.galleryService.search(this.filterType()).subscribe({
            next: (data) => {
                this.items.set(data);
                this.isLoading.set(false);
            },
            error: () => {
                this.hasError.set(true);
                this.isLoading.set(false);
            },
        });
    }

    /* ---------------- SEARCH & FILTER ---------------- */
    onSearch(event: Event) {
        this.searchQuery.set((event.target as HTMLInputElement).value.trim());
    }

    onFilterType(event: Event) {
        this.filterType.set((event.target as HTMLSelectElement).value);
        this.loadItems();
    }

    /* ---------------- Image File Handler ---------------- */
    onFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;

        if (input.files && input.files.length > 0) {
            this.handleFile(input.files[0]);
        }
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging.set(true);
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging.set(false);
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging.set(false);

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    private handleFile(file: File) {
        if (!file.type.startsWith('image/')) {
            this.toast.warning('Please select an image file', 'bottom-right', 5000);
            this.clearFileInput();
            return;
        }

        if (file.size > 3 * 1024 * 1024) {
            this.toast.warning('Image size should be less than 3MB', 'bottom-right', 5000);
            this.clearFileInput();
            return;
        }

        this.selectedFile.set(file);

        const reader = new FileReader();
        reader.onload = () => this.previewUrl.set(reader.result as string);
        reader.readAsDataURL(file);
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

        if (!this.formType) {
            this.toast.warning('Please select a type!', 'bottom-right', 5000);
            return;
        }

        if (!this.selected() && !this.selectedFile()) {
            this.toast.warning('Please select an image!', 'bottom-right', 5000);
            return;
        }

        this.isSubmitted.set(true);

        const user = this.authUser.getUserData();
        const formData = new FormData();

        formData.append('CompanyID', String(environment.companyCode));
        formData.append('Type', this.formType);
        formData.append('Description', this.formDescription || '');
        formData.append('PostBy', user?.userName || '');

        if (this.selectedFile()) {
            formData.append('ImageFile', this.selectedFile() as File);
        }

        if (this.selected()?.imageUrl) {
            formData.append('ImageUrl', this.selected()!.imageUrl);
        }

        const request$ = this.selected()
            ? this.galleryService.update(this.selected()!.id!, formData)
            : this.galleryService.add(formData);

        request$.subscribe({
            next: () => {
                this.loadItems();
                this.onToggleList();
                this.toast.success('Saved successfully!', 'bottom-right', 5000);
                this.isSubmitted.set(false);
            },
            error: (error) => {
                this.isSubmitted.set(false);
                console.error('Error:', error);
                this.toast.danger(error?.error || 'Save unsuccessful!', 'bottom-left', 3000);
            },
        });
    }

    /* ---------------- UPDATE ---------------- */
    onUpdate(item: GalleryM) {
        this.selected.set(item);

        this.formType = item.type || '';
        this.formDescription = item.description || '';

        if (item.imageUrl) {
            this.previewUrl.set(`${this.imgURL}${item.imageUrl}`);
        } else {
            this.previewUrl.set(null);
        }

        this.selectedFile.set(null);
        this.clearFileInput();
        this.showList.set(false);
    }

    /* ---------------- DELETE ---------------- */
    async onDelete(id: string) {
        const ok = await this.confirm.confirm({
            message: 'Are you sure you want to delete this image?',
            confirmText: "Yes, I'm sure",
            cancelText: 'No, cancel',
            variant: 'danger',
        });

        if (ok) {
            this.galleryService.delete(id).subscribe({
                next: () => {
                    this.items.update(list => list.filter(i => i.id !== id));
                    this.toast.success('Image deleted successfully!', 'bottom-right', 5000);
                },
                error: (error) => {
                    this.toast.danger(error?.error || 'Delete unsuccessful!', 'bottom-left', 3000);
                    console.error('Error deleting image:', error);
                },
            });
        }
    }

    /* ---------------- RESET ---------------- */
    formReset() {
        this.selected.set(null);
        this.selectedFile.set(null);
        this.previewUrl.set(null);
        this.formType = '';
        this.formDescription = '';
        this.isSubmitted.set(false);
        this.clearFileInput();
    }

    onToggleList() {
        this.showList.update(s => !s);
        this.formReset();
    }
}

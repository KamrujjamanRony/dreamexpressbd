// blog-list.ts
import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment.production';
import { SPermission } from '../../../services/s-permission';
import { SToast } from '../../../utils/toast/toast.service';
import { SConfirm } from '../../../utils/confirm/confirm.service';
import { BlogM, BlogDtl } from '../../../models/Blog';
import { SBlog } from '../../../services/s-blog';
import { SGallery } from '../../../services/s-gallery';
import { GalleryPicker } from '../../shared/gallery-picker/gallery-picker';

@Component({
    selector: 'app-blog-list',
    imports: [CommonModule, FontAwesomeModule, FormsModule, GalleryPicker],
    templateUrl: './blog-list.html',
    styleUrl: './blog-list.css',
})
export class BlogList {
    faPencil = faPencil;
    faXmark = faXmark;
    faMagnifyingGlass = faMagnifyingGlass;
    faTrash = faTrash;
    faPlus = faPlus;

    /* ---------------- DI ---------------- */
    private blogService = inject(SBlog);
    private galleryService = inject(SGallery);
    private permissionService = inject(SPermission);
    private toast = inject(SToast);
    private confirm = inject(SConfirm);

    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

    imgURL = environment.ImageApi;

    /* ---------------- SIGNAL STATE ---------------- */
    blogs = signal<BlogM[]>([]);
    searchQuery = signal('');

    filteredList = computed(() => {
        const query = this.searchQuery().toLowerCase();
        return this.blogs()
            .filter(b =>
                b.heading?.toLowerCase().includes(query) ||
                b.sl?.toString().includes(query)
            )
            .reverse();
    });

    selected = signal<BlogM | null>(null);

    // Main image gallery selection
    selectedGalleryId = signal<string>('');
    selectedGalleryUrl = signal<string>('');

    // Gallery URL map for display
    galleryMap = signal<Map<string, string>>(new Map());

    isLoading = signal(false);
    hasError = signal(false);

    isView = signal(false);
    isInsert = signal(false);
    isEdit = signal(false);
    isDelete = signal(false);

    isSubmitted = signal(false);
    showList = signal(true);

    /* ---------------- FORM MODEL ---------------- */
    sl = signal('');
    heading = signal('');
    vLink = signal('');

    /* ---------------- DETAIL ROWS ---------------- */
    dtls = signal<{ title: string; desc: string; iUrl: string }[]>([]);

    /* ---------------- LIFECYCLE ---------------- */
    ngOnInit(): void {
        this.loadBlogs();
        this.loadGalleryMap();
        this.loadPermissions();
    }

    /* ---------------- LOADERS ---------------- */
    loadPermissions() {
        this.isView.set(this.permissionService.hasPermission('Blog', 'view'));
        this.isInsert.set(this.permissionService.hasPermission('Blog', 'create'));
        this.isEdit.set(this.permissionService.hasPermission('Blog', 'edit'));
        this.isDelete.set(this.permissionService.hasPermission('Blog', 'delete'));
    }

    loadBlogs() {
        this.isLoading.set(true);
        this.hasError.set(false);

        this.blogService.search().subscribe({
            next: (data) => {
                this.blogs.set(data);
                this.isLoading.set(false);
            },
            error: () => {
                this.hasError.set(true);
                this.isLoading.set(false);
            }
        });
    }

    loadGalleryMap() {
        this.galleryService.search(undefined, 'Blog').subscribe({
            next: (data) => {
                this.galleryMap.set(new Map(data.map(g => [g.id || '', g.imageUrl || ''])));
            }
        });
    }

    getImageUrl(galleryId: string): string {
        return galleryId ? this.galleryMap().get(galleryId) || '' : '';
    }

    /* ---------------- SEARCH ---------------- */
    onSearch(event: Event) {
        this.searchQuery.set((event.target as HTMLInputElement).value.trim());
    }

    /* ---------------- GALLERY PICKER (MAIN IMAGE) ---------------- */
    onGalleryPicked(event: { id: string; imageUrl: string }) {
        this.selectedGalleryId.set(event.id);
        this.selectedGalleryUrl.set(event.imageUrl);
    }

    clearGalleryImage() {
        this.selectedGalleryId.set('');
        this.selectedGalleryUrl.set('');
    }

    /* ---------------- DETAIL ROW GALLERY PICKER ---------------- */
    onDtlGalleryPicked(index: number, event: { id: string; imageUrl: string }) {
        this.dtls.update(list => list.map((d, i) =>
            i === index ? { ...d, iUrl: event.id } : d
        ));
    }

    clearDtlGalleryImage(index: number) {
        this.dtls.update(list => list.map((d, i) =>
            i === index ? { ...d, iUrl: '' } : d
        ));
    }

    /* ---------------- DETAIL ROW MANAGEMENT ---------------- */
    addDetailRow() {
        this.dtls.update(list => [...list, { title: '', desc: '', iUrl: '' }]);
    }

    removeDetailRow(index: number) {
        this.dtls.update(list => list.filter((_, i) => i !== index));
    }

    updateDtlTitle(index: number, value: string) {
        this.dtls.update(list => list.map((d, i) =>
            i === index ? { ...d, title: value } : d
        ));
    }

    updateDtlDesc(index: number, value: string) {
        this.dtls.update(list => list.map((d, i) =>
            i === index ? { ...d, desc: value } : d
        ));
    }

    /* ---------------- SUBMIT ---------------- */
    onSubmit(event: Event) {
        event.preventDefault();

        if (!this.heading().trim()) {
            this.toast.warning('Heading is required!', 'bottom-right', 5000);
            return;
        }

        if (!this.selected() && !this.selectedGalleryId()) {
            this.toast.warning('Please select a main image!', 'bottom-right', 5000);
            return;
        }

        this.isSubmitted.set(true);

        const body: any = {
            companyID: environment.companyCode,
            sl: this.sl() || '0',
            heading: this.heading(),
            imageUrl: this.selectedGalleryId() || '',
            vLink: this.vLink() || '',
            dtls: this.dtls().map(d => ({
                title: d.title,
                desc: d.desc,
                iUrl: d.iUrl || '',
            })),
        };

        const request$ = this.selected()
            ? this.blogService.update(this.selected()!.id, body)
            : this.blogService.add(body);

        request$.subscribe({
            next: () => {
                this.loadBlogs();
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
    onUpdate(blog: BlogM) {
        this.selected.set(blog);

        this.sl.set(blog.sl || '');
        this.heading.set(blog.heading || '');
        this.vLink.set(blog.vLink || '');

        // imageUrl is the gallery ID from the API
        this.selectedGalleryId.set(blog.imageUrl || '');
        this.selectedGalleryUrl.set(this.getImageUrl(blog.imageUrl));

        // Set detail rows preserving gallery IDs
        this.dtls.set((blog.dtls || []).map(d => ({
            title: d.title || '',
            desc: d.desc || '',
            iUrl: d.iUrl || ''
        })));

        this.showList.set(false);
    }

    /* ---------------- DELETE ---------------- */
    async onDelete(id: any) {
        const ok = await this.confirm.confirm({
            message: 'Are you sure you want to delete this Blog?',
            confirmText: "Yes, I'm sure",
            cancelText: 'No, cancel',
            variant: 'danger',
        });

        if (ok) {
            this.blogService.delete(id).subscribe({
                next: () => {
                    this.blogs.update(list => list.filter(b => b.id !== id));
                    this.toast.success('Blog deleted successfully!', 'bottom-right', 5000);
                },
                error: (error) => {
                    this.toast.danger(
                        error?.error || 'Delete unsuccessful!',
                        'top-left',
                        3000
                    );
                    console.error('Error deleting Blog:', error);
                }
            });
        }
    }

    /* ---------------- RESET ---------------- */
    formReset() {
        this.sl.set('');
        this.heading.set('');
        this.vLink.set('');
        this.selected.set(null);
        this.selectedGalleryId.set('');
        this.selectedGalleryUrl.set('');
        this.dtls.set([]);
        this.isSubmitted.set(false);
    }

    onToggleList() {
        this.showList.update(s => !s);
        this.formReset();
    }
}

import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { Field } from '../field/field';
import { FormsModule } from '@angular/forms';
import { form, FormField, required, validate, debounce } from '@angular/forms/signals';
import { UpperCasePipe, TitleCasePipe } from '@angular/common';
import { QuillEditorComponent } from 'ngx-quill';

interface SpecItem {
  item: string;
  value: string;
}

interface Specification {
  title: string;
  content: SpecItem[];
}

@Component({
  selector: 'app-product-form',
  imports: [Field, FormsModule, FormField, UpperCasePipe, TitleCasePipe, QuillEditorComponent],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css',
})
export class ProductForm {
  @Input() product: any = null;
  @Input() allProducts: any[] = [];
  @Input() modalTitle: string = 'Product Form';
  @Input() categories: string[] = [];
  @Input() brands: string[] = [];

  @Output() submitForm = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  isSubmitted = false;
  sizeOptions = ['xs', 's', 'm', 'l', 'xl'];
  colorOptions = ['red', 'green', 'blue', 'black', 'white', 'brown', 'yellow'];
  availabilityOptions = ['in stock', 'out of stock', 'pre-order'];

  /* ---------------- Rich Text Editor ---------------- */
  editorShortDescription = '';
  editorProductDetails = '';
  editorOthers = '';

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

  /* ---------------- SIGNAL ARRAYS (dynamic) ---------------- */
  images = signal<string[]>([]);
  sizes = signal<string[]>([]);
  colors = signal<string[]>([]);
  relatedProducts = signal<number[]>([]);
  specifications = signal<Specification[]>([]);

  /* ---------------- FORM MODEL (scalar fields) ---------------- */
  model = signal({
    name: '',
    regularPrice: 0,
    offerPrice: 0,
    image: '',
    shortDescription: '',
    productDetails: '',
    category: '',
    brand: '',
    isFeatured: false,
    serial: 0,
    sku: '',
    availability: 'in stock',
    youtubeLink: '',
    facebookPost: '',
    twitterTweet: '',
    instagramPost: '',
    others: '',
    isActive: true,
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.name, { message: 'Product name is required' });
    required(schemaPath.shortDescription, { message: 'Short description is required' });
    required(schemaPath.category, { message: 'Category is required' });
    required(schemaPath.brand, { message: 'Brand is required' });
    required(schemaPath.sku, { message: 'SKU is required' });
    required(schemaPath.availability, { message: 'Availability is required' });

    validate(schemaPath.name, ({ value }) => {
      if (value() && value().length < 3) {
        return { kind: 'minLength', message: 'Name must be at least 3 characters' };
      }
      if (value() && value().length > 200) {
        return { kind: 'maxLength', message: 'Name must be less than 200 characters' };
      }
      return null;
    });

    validate(schemaPath.regularPrice, ({ value }) => {
      if (value() < 0) {
        return { kind: 'min', message: 'Regular price cannot be negative' };
      }
      return null;
    });

    validate(schemaPath.offerPrice, ({ value }) => {
      if (value() < 0) {
        return { kind: 'min', message: 'Offer price cannot be negative' };
      }
      return null;
    });

    validate(schemaPath.shortDescription, ({ value }) => {
      if (value() && value().length > 500) {
        return { kind: 'maxLength', message: 'Short description max 500 characters' };
      }
      return null;
    });

    validate(schemaPath.sku, ({ value }) => {
      if (value() && value().length < 2) {
        return { kind: 'minLength', message: 'SKU must be at least 2 characters' };
      }
      return null;
    });

    debounce(schemaPath.name, 300);
    debounce(schemaPath.shortDescription, 300);
    debounce(schemaPath.sku, 300);
  });

  ngOnChanges() {
    if (this.product) {
      this.model.set({
        name: this.product.name ?? '',
        regularPrice: this.product.regularPrice ?? 0,
        offerPrice: this.product.offerPrice ?? 0,
        image: this.product.image ?? '',
        shortDescription: this.product.shortDescription ?? '',
        productDetails: this.product.productDetails ?? '',
        category: this.product.category ?? '',
        brand: this.product.brand ?? '',
        isFeatured: this.product.isFeatured ?? false,
        serial: this.product.serial ?? 0,
        sku: this.product.sku ?? '',
        availability: this.product.availability ?? 'in stock',
        youtubeLink: this.product.youtubeLink ?? '',
        facebookPost: this.product.facebookPost ?? '',
        twitterTweet: this.product.twitterTweet ?? '',
        instagramPost: this.product.instagramPost ?? '',
        others: this.product.others ?? '',
        isActive: this.product.isActive ?? true,
      });

      // Sync editor properties
      this.editorShortDescription = this.product.shortDescription ?? '';
      this.editorProductDetails = this.product.productDetails ?? '';
      this.editorOthers = this.product.others ?? '';

      // Set signal arrays
      const imgs = this.product.images;
      if (imgs) {
        const imageList = Array.isArray(imgs)
          ? imgs
          : imgs.split(',').map((img: string) => img.trim());
        this.images.set(imageList.filter((img: string) => img));
      } else {
        this.images.set([]);
      }

      this.sizes.set(this.product.sizes ?? []);
      this.colors.set(this.product.colors ?? []);
      this.relatedProducts.set(this.product.relatedProducts ?? []);

      if (this.product.specifications) {
        this.specifications.set(
          this.product.specifications.map((spec: any) => ({
            title: spec.title ?? '',
            content: (spec.content ?? []).map((c: any) => ({
              item: c.item ?? '',
              value: c.value ?? '',
            })),
          }))
        );
      } else {
        this.specifications.set([]);
      }
    }
  }

  // --- Image array methods ---
  addImageField(imageUrl: string = '') {
    this.images.update(arr => [...arr, imageUrl]);
  }

  removeImageField(index: number) {
    this.images.update(arr => arr.filter((_, i) => i !== index));
  }

  updateImage(index: number, value: string) {
    this.images.update(arr => arr.map((v, i) => (i === index ? value : v)));
  }

  // --- Size methods ---
  addSize(size: string) {
    if (size && !this.sizes().includes(size)) {
      this.sizes.update(arr => [...arr, size]);
    }
  }

  removeSize(index: number) {
    this.sizes.update(arr => arr.filter((_, i) => i !== index));
  }

  // --- Color methods ---
  addColor(color: string) {
    if (color && !this.colors().includes(color)) {
      this.colors.update(arr => [...arr, color]);
    }
  }

  removeColor(index: number) {
    this.colors.update(arr => arr.filter((_, i) => i !== index));
  }

  // --- Related Products methods ---
  addRelatedProductField(productId: number = 0) {
    this.relatedProducts.update(arr => [...arr, productId]);
  }

  removeRelatedProductField(index: number) {
    this.relatedProducts.update(arr => arr.filter((_, i) => i !== index));
  }

  updateRelatedProduct(index: number, value: number) {
    this.relatedProducts.update(arr => arr.map((v, i) => (i === index ? value : v)));
  }

  // --- Specification methods ---
  addSpecification() {
    this.specifications.update(arr => [
      ...arr,
      { title: '', content: [{ item: '', value: '' }] },
    ]);
  }

  removeSpecification(index: number) {
    this.specifications.update(arr => arr.filter((_, i) => i !== index));
  }

  updateSpecTitle(specIndex: number, title: string) {
    this.specifications.update(arr =>
      arr.map((spec, i) => (i === specIndex ? { ...spec, title } : spec))
    );
  }

  addSpecItem(specIndex: number) {
    this.specifications.update(arr =>
      arr.map((spec, i) =>
        i === specIndex
          ? { ...spec, content: [...spec.content, { item: '', value: '' }] }
          : spec
      )
    );
  }

  removeSpecItem(specIndex: number, itemIndex: number) {
    this.specifications.update(arr =>
      arr.map((spec, i) =>
        i === specIndex
          ? { ...spec, content: spec.content.filter((_, j) => j !== itemIndex) }
          : spec
      )
    );
  }

  updateSpecItem(specIndex: number, itemIndex: number, field: 'item' | 'value', val: string) {
    this.specifications.update(arr =>
      arr.map((spec, i) =>
        i === specIndex
          ? {
            ...spec,
            content: spec.content.map((c, j) =>
              j === itemIndex ? { ...c, [field]: val } : c
            ),
          }
          : spec
      )
    );
  }

  onSubmit(event: Event) {
    this.isSubmitted = true;

    // Sync editor values to model before validation
    this.model.update(m => ({
      ...m,
      shortDescription: this.editorShortDescription,
      productDetails: this.editorProductDetails,
      others: this.editorOthers,
    }));

    if (this.form().valid()) {
      const formValue = this.form().value();
      this.submitForm.emit({
        ...formValue,
        images: this.images(),
        sizes: this.sizes(),
        colors: this.colors(),
        relatedProducts: this.relatedProducts(),
        specifications: this.specifications(),
      });
    }
  }

  onCancel() {
    this.cancel.emit();
  }

}

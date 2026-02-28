import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Field } from '../field/field';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-product-form',
  imports: [CommonModule, Field, ReactiveFormsModule],
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

  fb = inject(NonNullableFormBuilder);
  isSubmitted = false;
  sizeOptions = ['xs', 's', 'm', 'l', 'xl'];
  colorOptions = ['red', 'green', 'blue', 'black', 'white', 'brown', 'yellow'];
  availabilityOptions = ['in stock', 'out of stock', 'pre-order'];

  form = this.fb.group({
    name: ['', [Validators.required]],
    regularPrice: [0, [Validators.required, Validators.min(0)]],
    offerPrice: [0, [Validators.min(0)]],
    image: [''],
    images: this.fb.array<FormControl<string>>([]),
    shortDescription: ['', [Validators.required]],
    productDetails: [''],
    category: ['', [Validators.required]],
    sizes: this.fb.array([]),
    colors: this.fb.array([]),
    brand: ['', [Validators.required]],
    isFeatured: [false],
    serial: [0],
    relatedProducts: this.fb.array<FormControl<number>>([]),
    specifications: this.fb.array([]),
    sku: ['', [Validators.required]],
    availability: ['in stock', [Validators.required]],
    youtubeLink: [''],
    facebookPost: [''],
    twitterTweet: [''],
    instagramPost: [''],
    others: [''],
    isActive: [true]
  });

  ngOnChanges() {
    if (this.product) {
      this.form.patchValue({
        name: this.product.name,
        regularPrice: this.product.regularPrice,
        offerPrice: this.product.offerPrice,
        image: this.product.image,
        images: this.product.images,
        shortDescription: this.product.shortDescription,
        productDetails: this.product.productDetails,
        category: this.product.category,
        brand: this.product.brand,
        isFeatured: this.product.isFeatured,
        serial: this.product.serial,
        sku: this.product.sku,
        availability: this.product.availability,
        youtubeLink: this.product.youtubeLink,
        facebookPost: this.product.facebookPost,
        twitterTweet: this.product.twitterTweet,
        instagramPost: this.product.instagramPost,
        others: this.product.others,
        isActive: this.product.isActive
      });

      // Set images
      this.imagesArray.clear();
      if (this.product?.images) {
        const images = Array.isArray(this.product.images)
          ? this.product.images
          : this.product.images.split(',').map((img: string) => img.trim());

        images.forEach((img: string) => {
          if (img) this.addImageField(img);
        });
      }
      // Set related products
      this.relatedProductsArray.clear();
      if (this.product?.relatedProducts) {
        this.product.relatedProducts.forEach((id: number) => {
          this.addRelatedProductField(id);
        });
      }
      // Set sizes
      this.sizes.clear();
      this.product.sizes?.forEach((size: string) => {
        this.sizes.push(this.fb.control(size));
      });

      // Set colors
      this.colors.clear();
      this.product.colors?.forEach((color: string) => {
        this.colors.push(this.fb.control(color));
      });

      // Set related products
      this.relatedProducts.clear();
      this.product.relatedProducts?.forEach((id: number) => {
        this.relatedProducts.push(this.fb.control(id));
      });

      // Set specifications
      this.specifications.clear();
      this.product.specifications?.forEach((spec: any) => {
        this.specifications.push(this.fb.group({
          title: [spec.title],
          content: this.fb.array(
            spec.content.map((item: any) => this.fb.group({
              item: [item.item],
              value: [item.value]
            }))
          )
        }));
      });
    }
  }

  // for multiple images
  get imagesArray(): FormArray<FormControl<string>> {
    return this.form.get('images') as FormArray<FormControl<string>>;
  }

  addImageField(imageUrl: string = '') {
    this.imagesArray.push(this.fb.control(imageUrl));
  }

  removeImageField(index: number) {
    this.imagesArray.removeAt(index);
  }
  // methods for related products
  get relatedProductsArray(): FormArray<FormControl<number>> {
    return this.form.get('relatedProducts') as FormArray<FormControl<number>>;
  }

  addRelatedProductField(productId: number | null = null) {
    this.relatedProductsArray.push(this.fb.control(productId || 0));
  }

  removeRelatedProductField(index: number) {
    this.relatedProductsArray.removeAt(index);
  }
  // Sizes and Colors are managed as FormArrays to allow dynamic addition/removal
  get sizes() {
    return this.form.get('sizes') as FormArray;
  }

  addSize(size: string) {
    if (!this.sizes.value.includes(size)) {
      this.sizes.push(this.fb.control(size));
    }
  }

  removeSize(index: number) {
    this.sizes.removeAt(index);
  }

  get colors() {
    return this.form.get('colors') as FormArray;
  }

  addColor(color: string) {
    if (!this.colors.value.includes(color)) {
      this.colors.push(this.fb.control(color));
    }
  }

  removeColor(index: number) {
    this.colors.removeAt(index);
  }

  // Related Products are managed as FormArray to allow dynamic addition/removal
  // and to ensure that the same product cannot be added multiple times
  get relatedProducts() {
    return this.form.get('relatedProducts') as FormArray;
  }

  addRelatedProduct(id: number) {
    if (!this.relatedProducts.value.includes(id)) {
      this.relatedProducts.push(this.fb.control(id));
    }
  }

  removeRelatedProduct(index: number) {
    this.relatedProducts.removeAt(index);
  }

  // Specifications are managed as FormArray to allow dynamic addition/removal
  // and to ensure that each specification can have multiple items with values
  get specifications() {
    return this.form.get('specifications') as FormArray;
  }

  getSpecTitle(spec: AbstractControl): FormControl<string> {
    return (spec as FormGroup).controls['title'] as FormControl<string>;
  }

  getSpecContent(spec: AbstractControl): FormArray {
    return (spec as FormGroup).controls['content'] as FormArray;
  }

  getItemControl(item: AbstractControl): FormGroup {
    return item as FormGroup;
  }

  getItemField(item: FormGroup, field: string): FormControl {
    return item.controls[field] as FormControl;
  }

  addSpecification() {
    this.specifications.push(this.fb.group({
      title: [''],
      content: this.fb.array([
        this.fb.group({
          item: [''],
          value: ['']
        })
      ])
    }));
  }

  removeSpecification(index: number) {
    this.specifications.removeAt(index);
  }

  addSpecItem(specIndex: number) {
    const specGroup = this.specifications.at(specIndex) as FormGroup;
    const contentArray = specGroup.get('content') as FormArray;
    contentArray.push(this.fb.group({
      item: [''],
      value: ['']
    }));
  }

  removeSpecItem(specIndex: number, itemIndex: number) {
    const specGroup = this.specifications.at(specIndex) as FormGroup;
    const contentArray = specGroup.get('content') as FormArray;
    contentArray.removeAt(itemIndex);
  }

  onSubmit(event: Event) {
    this.isSubmitted = true;
    if (this.form.valid) {
      this.submitForm.emit(this.form.value);
    }
  }

  onCancel() {
    this.cancel.emit();
  }

}

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductSkeleton } from './product-skeleton';

describe('ProductSkeleton', () => {
  let component: ProductSkeleton;
  let fixture: ComponentFixture<ProductSkeleton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductSkeleton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductSkeleton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatedProduct } from './related-product';

describe('RelatedProduct', () => {
  let component: RelatedProduct;
  let fixture: ComponentFixture<RelatedProduct>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelatedProduct]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RelatedProduct);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductRatting } from './product-ratting';

describe('ProductRatting', () => {
  let component: ProductRatting;
  let fixture: ComponentFixture<ProductRatting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductRatting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductRatting);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

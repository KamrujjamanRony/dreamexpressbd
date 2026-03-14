import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarouselList } from './carousel-list';

describe('CarouselList', () => {
  let component: CarouselList;
  let fixture: ComponentFixture<CarouselList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarouselList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarouselList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

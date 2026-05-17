import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSection } from './add-section';

describe('AddSection', () => {
  let component: AddSection;
  let fixture: ComponentFixture<AddSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddSection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

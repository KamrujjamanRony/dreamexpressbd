import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TokenList } from './token-list';

describe('TokenList', () => {
  let component: TokenList;
  let fixture: ComponentFixture<TokenList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TokenList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TokenList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

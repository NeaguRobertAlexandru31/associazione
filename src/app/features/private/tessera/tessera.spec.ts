import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tessera } from './tessera';

describe('Tessera', () => {
  let component: Tessera;
  let fixture: ComponentFixture<Tessera>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tessera],
    }).compileComponents();

    fixture = TestBed.createComponent(Tessera);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

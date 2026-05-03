import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Messagges } from './messagges';

describe('Messagges', () => {
  let component: Messagges;
  let fixture: ComponentFixture<Messagges>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Messagges],
    }).compileComponents();

    fixture = TestBed.createComponent(Messagges);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

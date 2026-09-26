import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IscrizioneSuccesso } from './iscrizione-successo';

describe('IscrizioneSuccesso', () => {
  let component: IscrizioneSuccesso;
  let fixture: ComponentFixture<IscrizioneSuccesso>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IscrizioneSuccesso],
    }).compileComponents();

    fixture = TestBed.createComponent(IscrizioneSuccesso);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

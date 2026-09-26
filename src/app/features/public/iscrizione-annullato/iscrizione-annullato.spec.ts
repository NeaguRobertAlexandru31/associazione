import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IscrizioneAnnullato } from './iscrizione-annullato';

describe('IscrizioneAnnullato', () => {
  let component: IscrizioneAnnullato;
  let fixture: ComponentFixture<IscrizioneAnnullato>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IscrizioneAnnullato],
    }).compileComponents();

    fixture = TestBed.createComponent(IscrizioneAnnullato);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

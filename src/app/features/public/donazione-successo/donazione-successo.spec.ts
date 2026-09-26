import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonazioneSuccesso } from './donazione-successo';

describe('DonazioneSuccesso', () => {
  let component: DonazioneSuccesso;
  let fixture: ComponentFixture<DonazioneSuccesso>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonazioneSuccesso],
    }).compileComponents();

    fixture = TestBed.createComponent(DonazioneSuccesso);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

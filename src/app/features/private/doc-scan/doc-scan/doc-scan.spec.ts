import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocScan } from './doc-scan';

describe('DocScan', () => {
  let component: DocScan;
  let fixture: ComponentFixture<DocScan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocScan],
    }).compileComponents();

    fixture = TestBed.createComponent(DocScan);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

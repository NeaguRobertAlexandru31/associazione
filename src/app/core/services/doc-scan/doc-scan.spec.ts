import { TestBed } from '@angular/core/testing';

import { DocScan } from './doc-scan';

describe('DocScan', () => {
  let service: DocScan;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocScan);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

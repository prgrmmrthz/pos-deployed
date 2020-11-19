import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PosModalContentComponent } from './pos-modal-content.component';

describe('PosModalContentComponent', () => {
  let component: PosModalContentComponent;
  let fixture: ComponentFixture<PosModalContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PosModalContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PosModalContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

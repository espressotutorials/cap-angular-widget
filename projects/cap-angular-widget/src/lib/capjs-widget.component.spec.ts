import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CapjsWidgetComponent } from './capjs-widget.component';

describe('CapjsWidgetComponent', () => {
  let component: CapjsWidgetComponent;
  let fixture: ComponentFixture<CapjsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CapjsWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CapjsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

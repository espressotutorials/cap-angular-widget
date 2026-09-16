import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { CapWidget } from 'cap-widget';

import { CapjsWidgetComponent } from './capjs-widget.component';

describe('CapjsWidgetComponent', () => {
  let component: CapjsWidgetComponent;
  let fixture: ComponentFixture<CapjsWidgetComponent>;
  let widget: CapWidget;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CapjsWidgetComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CapjsWidgetComponent);
    fixture.componentRef.setInput('endpoint', 'https://cap.example.com/site-key/');
    fixture.detectChanges();
    await customElements.whenDefined('cap-widget');

    component = fixture.componentInstance;
    widget = fixture.nativeElement.querySelector('cap-widget') as CapWidget;
  });

  it('renders the current Cap widget attributes', () => {
    fixture.componentRef.setInput('workerCount', 4);
    fixture.componentRef.setInput('hiddenFieldName', 'captcha-token');
    fixture.componentRef.setInput('troubleshootingUrl', '/captcha-help');
    fixture.componentRef.setInput('disableHaptics', true);
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('theme', 'dark');
    fixture.detectChanges();

    expect(widget.getAttribute('data-cap-api-endpoint')).toBe(
      'https://cap.example.com/site-key/'
    );
    expect(widget.getAttribute('data-cap-worker-count')).toBe('4');
    expect(widget.getAttribute('data-cap-hidden-field-name')).toBe('captcha-token');
    expect(widget.getAttribute('data-cap-troubleshooting-url')).toBe('/captcha-help');
    expect(widget.hasAttribute('data-cap-disable-haptics')).toBeTrue();
    expect(widget.hasAttribute('required')).toBeTrue();
    expect(widget.classList.contains('dark')).toBeTrue();
  });

  it('propagates solve events to outputs and Angular forms', () => {
    const onChange = jasmine.createSpy('onChange');
    const onTouched = jasmine.createSpy('onTouched');
    const emitted = jasmine.createSpy('solve');
    component.registerOnChange(onChange);
    component.registerOnTouched(onTouched);
    component.solve.subscribe(emitted);

    HTMLElement.prototype.dispatchEvent.call(
      widget,
      new CustomEvent('solve', { detail: { token: 'token-123' } })
    );

    expect(emitted).toHaveBeenCalledOnceWith('token-123');
    expect(onChange).toHaveBeenCalledOnceWith('token-123');
    expect(onTouched).toHaveBeenCalledTimes(1);
  });

  it('exposes both the legacy error message and structured error detail', () => {
    const message = jasmine.createSpy('error');
    const detail = jasmine.createSpy('errorDetail');
    component.error.subscribe(message);
    component.errorDetail.subscribe(detail);
    const capError = { isCap: true, code: 'network_error', message: 'Request failed' };

    HTMLElement.prototype.dispatchEvent.call(
      widget,
      new CustomEvent('error', { detail: capError })
    );

    expect(message).toHaveBeenCalledOnceWith('Request failed');
    expect(detail).toHaveBeenCalledOnceWith(capError);
  });

  it('supports reset and disabled state through ControlValueAccessor', () => {
    const reset = spyOn(widget, 'reset').and.callThrough();

    component.writeValue(null);
    component.setDisabledState(true);

    expect(reset).toHaveBeenCalledTimes(1);
    expect(widget.inert).toBeTrue();
    expect(fixture.nativeElement.getAttribute('aria-disabled')).toBe('true');
    expect(fixture.nativeElement.classList.contains('capjs-widget-disabled')).toBeTrue();
  });

  it('removes its event listeners on destroy', () => {
    const emitted = jasmine.createSpy('solve');
    component.solve.subscribe(emitted);

    fixture.destroy();
    HTMLElement.prototype.dispatchEvent.call(
      widget,
      new CustomEvent('solve', { detail: { token: 'late-token' } })
    );

    expect(emitted).not.toHaveBeenCalled();
  });
});

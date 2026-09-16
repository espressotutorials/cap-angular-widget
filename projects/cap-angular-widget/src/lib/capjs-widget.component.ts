import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  EventEmitter,
  forwardRef,
  Inject,
  Input,
  OnDestroy,
  Output,
  PLATFORM_ID,
  ViewEncapsulation
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { CapWidget, SolveResult } from 'cap-widget';

type CapWindow = Window & {
  CAP_CUSTOM_FETCH?: typeof fetch;
  CAP_CUSTOM_WASM_URL?: string;
  CAP_CSS_NONCE?: string;
  CAP_SCRIPT_NONCE?: string;
};

export interface CapjsError {
  code?: string;
  isCap?: boolean;
  message: string;
}

@Component({
  selector: 'capjs-widget',
  standalone: true,
  template: `
    <cap-widget
      #widget
      [attr.data-cap-api-endpoint]="endpoint"
      [attr.data-cap-worker-count]="workerCount"
      [attr.data-cap-hidden-field-name]="hiddenFieldName"
      [attr.data-cap-troubleshooting-url]="troubleshootingUrl"
      [attr.data-cap-disable-haptics]="disableHaptics ? '' : null"
      [attr.required]="required ? '' : null"
      [attr.data-cap-i18n-initial-state]="i18nInitial"
      [attr.data-cap-i18n-verifying-label]="i18nVerifying"
      [attr.data-cap-i18n-solved-label]="i18nSolved"
      [attr.data-cap-i18n-error-label]="i18nError"
      [attr.data-cap-i18n-troubleshooting-label]="i18nTroubleshooting"
      [attr.data-cap-i18n-wasm-disabled]="i18nWasmDisabled"
      [attr.data-cap-i18n-group-aria-label]="i18nGroupAria"
      [attr.data-cap-i18n-verify-aria-label]="i18nVerifyAria"
      [attr.data-cap-i18n-verifying-aria-label]="i18nVerifyingAria"
      [attr.data-cap-i18n-verified-aria-label]="i18nVerifiedAria"
      [attr.data-cap-i18n-required-label]="i18nRequired"
      [attr.data-cap-i18n-error-aria-label]="i18nErrorAria"
      [class.dark]="theme === 'dark'"
    ></cap-widget>
  `,
  styleUrls: ['./capjs-widget.component.css'],
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CapjsWidgetComponent),
      multi: true
    }
  ]
})
export class CapjsWidgetComponent
  implements AfterViewInit, OnDestroy, ControlValueAccessor
{
  @Input({ required: true }) endpoint!: string;
  @Input() workerCount?: number;
  @Input() hiddenFieldName?: string;
  @Input() troubleshootingUrl?: string;
  @Input() disableHaptics = false;
  @Input() required = false;
  @Input() theme: 'light' | 'dark' = 'light';

  @Input() i18nInitial?: string;
  @Input() i18nVerifying?: string;
  @Input() i18nSolved?: string;
  @Input() i18nError?: string;
  @Input() i18nTroubleshooting?: string;
  @Input() i18nWasmDisabled?: string;
  @Input() i18nGroupAria?: string;
  @Input() i18nVerifyAria?: string;
  @Input() i18nVerifyingAria?: string;
  @Input() i18nVerifiedAria?: string;
  @Input() i18nRequired?: string;
  @Input() i18nErrorAria?: string;

  @Input() customFetch?: typeof fetch;
  @Input() customWasmUrl?: string;
  /** @deprecated Use customWasmUrl. */
  @Input() customWaspUrl?: string;
  @Input() cssNonce?: string;
  @Input() scriptNonce?: string;

  @Output() readonly solve = new EventEmitter<string>();
  @Output() readonly error = new EventEmitter<string>();
  @Output() readonly errorDetail = new EventEmitter<CapjsError>();
  @Output() readonly progress = new EventEmitter<number>();
  @Output() readonly reset = new EventEmitter<void>();

  private widget?: CapWidget;
  private widgetReady?: Promise<void>;
  private disabled = false;
  private destroyed = false;
  private resetPending = false;
  private writingValue = false;
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  private readonly handleSolve = (event: Event): void => {
    const token = (event as CustomEvent<{ token?: string }>).detail?.token;
    if (!token) return;

    this.solve.emit(token);
    this.onChange(token);
    this.onTouched();
  };

  private readonly handleError = (event: Event): void => {
    const detail = (event as CustomEvent<CapjsError>).detail;
    if (!detail?.message) return;

    this.error.emit(detail.message);
    this.errorDetail.emit(detail);
  };

  private readonly handleProgress = (event: Event): void => {
    const progress = (event as CustomEvent<{ progress?: number }>).detail?.progress;
    if (progress === undefined) return;

    this.progress.emit(progress);
  };

  private readonly handleReset = (): void => {
    this.reset.emit();
    if (!this.writingValue) this.onChange(null);
  };

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const widget = this.host.nativeElement.querySelector<CapWidget>('cap-widget');
    if (!widget) return;

    this.widget = widget;
    this.addEventListeners(widget);
    this.configureGlobalOptions();
    this.applyDisabledState();
    this.widgetReady = this.loadWidget();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.widget) this.removeEventListeners(this.widget);
  }

  writeValue(value: string | null): void {
    if (value !== null && value !== '') return;
    this.resetFromModel();
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
    this.applyDisabledState();
  }

  async solveWidget(): Promise<SolveResult> {
    await this.widgetReady;
    if (!this.widget || typeof this.widget.solve !== 'function') {
      throw new Error('Cap widget is not initialized');
    }
    return this.widget.solve();
  }

  resetWidget(): void {
    if (this.widget && typeof this.widget.reset === 'function') {
      this.widget.reset();
      return;
    }
    this.resetPending = true;
  }

  private async loadWidget(): Promise<void> {
    try {
      await import('cap-widget');
      if (this.resetPending && !this.destroyed) {
        this.resetPending = false;
        this.resetFromModel();
      }
    } catch (cause) {
      if (this.destroyed) return;
      const message = cause instanceof Error ? cause.message : 'Failed to load cap-widget';
      this.error.emit(message);
      this.errorDetail.emit({ message });
    }
  }

  private configureGlobalOptions(): void {
    const capWindow = window as CapWindow;
    if (this.customFetch) capWindow.CAP_CUSTOM_FETCH = this.customFetch;
    if (this.customWasmUrl ?? this.customWaspUrl) {
      capWindow.CAP_CUSTOM_WASM_URL = this.customWasmUrl ?? this.customWaspUrl;
    }
    if (this.cssNonce) capWindow.CAP_CSS_NONCE = this.cssNonce;
    if (this.scriptNonce) capWindow.CAP_SCRIPT_NONCE = this.scriptNonce;
  }

  private addEventListeners(widget: CapWidget): void {
    widget.addEventListener('solve', this.handleSolve);
    widget.addEventListener('error', this.handleError);
    widget.addEventListener('progress', this.handleProgress);
    widget.addEventListener('reset', this.handleReset);
  }

  private removeEventListeners(widget: CapWidget): void {
    widget.removeEventListener('solve', this.handleSolve);
    widget.removeEventListener('error', this.handleError);
    widget.removeEventListener('progress', this.handleProgress);
    widget.removeEventListener('reset', this.handleReset);
  }

  private resetFromModel(): void {
    if (!this.widget || typeof this.widget.reset !== 'function') {
      this.resetPending = true;
      return;
    }

    this.writingValue = true;
    try {
      this.widget.reset();
    } finally {
      this.writingValue = false;
    }
  }

  private applyDisabledState(): void {
    this.host.nativeElement.classList.toggle('capjs-widget-disabled', this.disabled);
    this.host.nativeElement.setAttribute('aria-disabled', String(this.disabled));
    if (this.widget) this.widget.inert = this.disabled;
  }
}

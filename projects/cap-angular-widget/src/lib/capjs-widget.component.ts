import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewEncapsulation,
  forwardRef,
  ElementRef,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import '@cap-js/widget';

@Component({
  selector: 'capjs-widget',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <cap-widget
      #widget
      [attr.data-cap-api-endpoint]="endpoint"
      [attr.data-cap-worker-count]="workerCount"
      [attr.data-cap-i18n-verifying-label]="i18nVerifying"
      [attr.data-cap-i18n-initial-state]="i18nInitial"
      [attr.data-cap-i18n-solved-label]="i18nSolved"
      [attr.data-cap-i18n-error-label]="i18nError"
      [ngClass]="theme"
    ></cap-widget>
  `,
  styleUrls: ['./capjs-widget.component.css'],
  encapsulation: ViewEncapsulation.None,
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
  @Input() endpoint!: string;
  @Input() workerCount?: number;
  @Input() i18nVerifying?: string;
  @Input() i18nInitial?: string;
  @Input() i18nSolved?: string;
  @Input() i18nError?: string;
  @Input() theme: 'light' | 'dark' = 'light';

  @Input() customFetch?: (url: string, options?: RequestInit) => Promise<unknown>;
  @Input() customWaspUrl?: string;

  @Output() solve = new EventEmitter<string>();
  @Output() error = new EventEmitter<string>();
  @Output() progress = new EventEmitter<number>();
  @Output() reset = new EventEmitter<void>();

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    const widget = this.host.nativeElement.querySelector('cap-widget')!;

    (window as any)['CAP_CUSTOM_FETCH'] = this.customFetch;
    (window as any)['CAP_CUSTOM_WASM_URL'] = this.customWaspUrl;

    widget.addEventListener('solve', (e: any) => {
      const token = e?.detail?.token;
      if (token) {
        this.solve.emit(token);
        this.onChange(token);
        this.onTouched();
      }
    });

    widget.addEventListener('error', (e: any) => {
      const message = e?.detail?.message;
      if (message) this.error.emit(message);
    });

    widget.addEventListener('progress', (e: any) => {
      const progress = e?.detail?.progress;
      if (progress !== undefined) this.progress.emit(progress);
    });

    widget.addEventListener('reset', () => {
      this.reset.emit();
      this.onChange(null);
    });
  }

  ngOnDestroy(): void {
    const widget = this.host.nativeElement.querySelector('cap-widget');
    widget?.removeEventListener('solve', () => {});
    widget?.removeEventListener('error', () => {});
    widget?.removeEventListener('progress', () => {});
    widget?.removeEventListener('reset', () => {});
  }

  // Reactive Forms API
  writeValue(value: string | null): void {
    // read-only component – value is written by solve event
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}

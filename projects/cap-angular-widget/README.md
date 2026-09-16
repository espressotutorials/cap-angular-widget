# @espressotutorialsgmbh/cap-angular-widget

Angular 21 and 22 standalone component for the
[Cap](https://trycap.dev/guide/) proof-of-work CAPTCHA. It wraps the official
`cap-widget` web component and integrates it with Angular reactive forms.

For existing applications, see the
[German migration guide](https://github.com/espressotutorials/cap-angular-widget/blob/master/MIGRATION.md).

## Installation

```bash
npm install @espressotutorialsgmbh/cap-angular-widget cap-widget
```

## Usage

```ts
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CapjsWidgetComponent } from '@espressotutorialsgmbh/cap-angular-widget';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [CapjsWidgetComponent, ReactiveFormsModule],
  template: `
    <form>
      <capjs-widget
        [formControl]="captcha"
        endpoint="https://<your-instance>/<site-key>/"
        [required]="true"
        theme="dark"
        (solve)="onSolve($event)"
        (errorDetail)="onError($event)"
      />
    </form>
  `
})
export class ContactFormComponent {
  readonly captcha = new FormControl<string | null>(null, Validators.required);

  onSolve(token: string): void {
    console.log('CAP token:', token);
  }

  onError(error: { message: string; code?: string }): void {
    console.error(error);
  }
}
```

The endpoint for Cap Standalone has the form
`https://<your-instance>/<site-key>/`. Verify every generated token on your
server through the Cap `siteverify` endpoint. Tokens are single-use.

## Inputs

| Input | Type | Description |
| --- | --- | --- |
| `endpoint` | `string` | Required Cap API endpoint |
| `workerCount` | `number` | Number of solver workers |
| `hiddenFieldName` | `string` | Native form field name; defaults to `cap-token` |
| `troubleshootingUrl` | `string` | URL shown when instrumentation is blocked |
| `disableHaptics` | `boolean` | Disables vibration for this widget |
| `required` | `boolean` | Enables the native Cap required state |
| `theme` | `'light' \| 'dark'` | Wrapper color theme |
| `customFetch` | `typeof fetch` | Sets `window.CAP_CUSTOM_FETCH` before loading Cap |
| `customWasmUrl` | `string` | Sets `window.CAP_CUSTOM_WASM_URL` |
| `cssNonce` | `string` | CSP nonce for injected styles |
| `scriptNonce` | `string` | CSP nonce for injected scripts |

The supported localization inputs are `i18nInitial`, `i18nVerifying`,
`i18nSolved`, `i18nError`, `i18nTroubleshooting`, `i18nWasmDisabled`,
`i18nGroupAria`, `i18nVerifyAria`, `i18nVerifyingAria`,
`i18nVerifiedAria`, `i18nRequired`, and `i18nErrorAria`.

`customWaspUrl` remains available as a deprecated alias for the corrected
`customWasmUrl` input. Cap's fetch, WASM, and CSP settings are global browser
settings. Use the same settings for all widget instances on a page.

## Outputs

| Output | Value |
| --- | --- |
| `solve` | Solved token |
| `progress` | Progress from 0 to 100 |
| `error` | Error message, kept for backwards compatibility |
| `errorDetail` | Structured `{ message, code?, isCap? }` error |
| `reset` | Emitted when Cap returns to its initial state |

The component also exposes `solveWidget()` and `resetWidget()` for
programmatic flows. Calling `FormControl.reset()` resets the underlying Cap
widget, and the disabled control state blocks interaction.

## Styling

The wrapper forwards Cap's CSS custom properties to the underlying web
component. They can be defined globally:

```css
cap-widget {
  --cap-background: #fdfdfd;
  --cap-color: #212121;
  --cap-border-radius: 14px;
  --cap-widget-width: 260px;
}
```

See the [official widget guide](https://trycap.dev/guide/widget.html) for the
complete list of CSS properties and server-side verification instructions.

## License

MIT

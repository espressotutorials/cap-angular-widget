# cap-angular-widget

An Angular 19+ Standalone Component wrapper for [CapJS](https://capjs.js.org/) – a privacy-friendly CAPTCHA alternative.

## ✨ Features

- ✅ Angular **standalone component**
- ✅ Reactive Forms support (`formControlName`)
- ✅ Event handling (`solve`, `error`, `progress`, `reset`)
- ✅ Light & Dark mode support
- ✅ Custom styling via CSS

---

## 📦 Installation

```bash
npm install cap-angular-widget
```

Optional (falls nicht automatisch installiert):

```bash
npm install @cap.js/widget
```

---

## 🚀 Usage

### Import into your standalone component:

```ts
import { CapjsWidgetComponent } from 'cap-angular-widget';

@Component({
  standalone: true,
  imports: [CapjsWidgetComponent, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <capjs-widget
        formControlName="captcha"
        [endpoint]="'https://api.example.com/captcha'"
        theme="dark"
        (solve)="onSolve($event)"
      ></capjs-widget>
    </form>
  `
})
export class MyPageComponent {
  form = this.fb.group({ captcha: [''] });

  constructor(private fb: FormBuilder) {}

  onSolve(token: string) {
    console.log('CAP solved:', token);
  }
}
```

---

## 🎨 Themes

The component supports both `light` and `dark` themes via `[theme]` input.

You can also apply your own styles using `::ng-deep` or global styles:

```css
cap-widget.dark {
  --cap-background: #111;
  --cap-color: white;
}
```

---

## 🧪 Events

| Event     | Description              |
|-----------|--------------------------|
| `solve`   | Emits the solved token   |
| `error`   | Emits error message      |
| `progress`| Emits numeric progress   |
| `reset`   | Emits when reset happens |

---

## 🛠 Inputs

| Input         | Type     | Description                           |
|---------------|----------|---------------------------------------|
| `endpoint`    | `string` | **Required.** API endpoint            |
| `theme`       | `string` | `'light'` (default) or `'dark'`       |
| `workerCount` | `number` | Optional worker count                 |
| `i18n*`       | `string` | Internationalization labels           |
| `customFetch` | `func`   | Optional override for fetch           |
| `customWaspUrl` | `string` | Override the WASM URL               |

---

## 📄 License

MIT

### Developed by
[Espresso Tutorials GmbH](https://www.espresso-tutorials.com/)

import { Component } from '@angular/core';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  CapjsError,
  CapjsWidgetComponent
} from '@espressotutorialsgmbh/cap-angular-widget';

@Component({
  selector: 'app-root',
  imports: [CapjsWidgetComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  readonly captcha = new FormControl<string | null>(null, Validators.required);
  endpoint = 'https://cap.example.com/site-key/';
  status = 'Waiting for verification';

  onSolve(token: string): void {
    this.status = `Solved: ${token}`;
  }

  onError(error: CapjsError): void {
    this.status = `${error.code ?? 'error'}: ${error.message}`;
  }
}

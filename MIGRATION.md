# Migration auf CAP Angular Widget 0.1

Diese Anleitung beschreibt die Aktualisierung bestehender Angular-Projekte von
Version 0.0.x und **@cap.js/widget** auf Version 0.1 mit dem offiziellen Paket
**cap-widget**.

## 1. Voraussetzungen prüfen

Version 0.1 unterstützt Angular 21 und 22. Prüft zunächst die verwendeten
Versionen:

~~~bash
node --version
npx ng version
npm ls @angular/core @espressotutorialsgmbh/cap-angular-widget
~~~

Projekte mit Angular 21 oder 22 können direkt mit Schritt 2 fortfahren.
Angular-Projekte bis Version 20 müssen zuerst aktualisiert werden. Bei Angular
19 sollten die Major-Versionen nacheinander migriert werden:

~~~bash
npx ng update @angular/core@20 @angular/cli@20
npx ng update @angular/core@21 @angular/cli@21
~~~

Führt nach jedem Schritt Build und Tests aus und prüft die von Angular
erzeugten Migrationen.

## 2. npm-Pakete austauschen

Das bisherige Paket **@cap.js/widget** wurde durch **cap-widget** ersetzt:

~~~bash
npm uninstall @cap.js/widget
npm install @espressotutorialsgmbh/cap-angular-widget@^0.1.0 cap-widget@^0.1.57
~~~

Die relevanten Einträge in package.json sollten danach so aussehen:

~~~json
{
  "dependencies": {
    "@espressotutorialsgmbh/cap-angular-widget": "^0.1.0",
    "cap-widget": "^0.1.57"
  }
}
~~~

Checkt den aktualisierten package-lock.json mit ein. Das ist besonders
wichtig, wenn der alte Lockfile noch auf die nicht mehr verfügbare Version
**@cap.js/widget@0.1.18** verweist. Anschließend muss eine saubere Installation
funktionieren:

~~~bash
npm ci
~~~

## 3. TypeScript-Import korrigieren

Verwendet immer den vollständigen Paketnamen:

~~~ts
import { CapjsWidgetComponent } from '@espressotutorialsgmbh/cap-angular-widget';
~~~

Ein alter Import aus **cap-angular-widget** muss entfernt werden. Bei
Standalone Components bleibt die Einbindung ansonsten unverändert:

~~~ts
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CapjsWidgetComponent } from '@espressotutorialsgmbh/cap-angular-widget';

@Component({
  standalone: true,
  imports: [CapjsWidgetComponent, ReactiveFormsModule]
})
export class ContactFormComponent {}
~~~

## 4. Template und Formular aktualisieren

Eine minimale Reactive-Forms-Integration sieht so aus:

~~~html
<form [formGroup]="form" (ngSubmit)="submit()">
  <capjs-widget
    formControlName="captcha"
    endpoint="https://cap.example.com/site-key/"
    [required]="true"
    (solve)="onSolve($event)"
    (errorDetail)="onCaptchaError($event)"
  />

  <button type="submit" [disabled]="form.invalid">Absenden</button>
</form>
~~~

Der Endpoint einer aktuellen Cap-Standalone-Installation enthält den Site Key
und endet mit einem Slash:

~~~text
https://<cap-instanz>/<site-key>/
~~~

Die Formularkonfiguration kann wie gewohnt mit Validators.required erfolgen:

~~~ts
import { inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import type { CapjsError } from '@espressotutorialsgmbh/cap-angular-widget';

export class ContactFormComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    captcha: this.formBuilder.control<string | null>(null, Validators.required)
  });

  onSolve(token: string): void {
    console.log('CAP token:', token);
  }

  onCaptchaError(error: CapjsError): void {
    console.error(error.code, error.message);
  }

  submit(): void {
    if (this.form.invalid) return;
    // Formular an das eigene Backend senden.
  }
}
~~~

Der Wrapper unterstützt jetzt FormControl.reset() und den Disabled-State
vollständig. form.reset() setzt deshalb auch das sichtbare CAP-Widget zurück.

## 5. Geänderte und neue Optionen

| Bisher | Ab Version 0.1 | Hinweis |
| --- | --- | --- |
| customWaspUrl | customWasmUrl | Der alte Name bleibt vorerst als veralteter Alias verfügbar |
| error | error oder errorDetail | error liefert den Text; errorDetail zusätzlich Fehlercode und Cap-Kennung |
| – | hiddenFieldName | Name des nativen Formularfeldes, standardmäßig cap-token |
| – | troubleshootingUrl | Eigene Hilfeseite für blockierte Instrumentierung |
| – | disableHaptics | Deaktiviert Vibration für dieses Widget |
| – | required | Aktiviert die native Required-Darstellung |
| – | cssNonce / scriptNonce | CSP-Nonces für injizierte Styles und Scripts |

Die bisherigen Inputs endpoint, workerCount, theme, customFetch und die vier
bisherigen i18n-Texte bleiben erhalten. Weitere i18n- und ARIA-Texte stehen in
der Paket-README.

## 6. CSP und globale Cap-Konfiguration

customFetch, customWasmUrl, cssNonce und scriptNonce setzen globale
Cap-Browseroptionen. Mehrere Widgets auf derselben Seite sollten deshalb
dieselben Werte verwenden.

~~~html
<capjs-widget
  [formControl]="captcha"
  [endpoint]="capEndpoint"
  [customFetch]="authenticatedFetch"
  customWasmUrl="/assets/cap/cap_wasm_bg.wasm"
  [cssNonce]="nonce"
  [scriptNonce]="nonce"
/>
~~~

Wenn Angular beim Build meldet, dass cap-widget kein ESM-Paket ist, kann das
offizielle Paket in angular.json freigegeben werden:

~~~json
{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "options": {
            "allowedCommonJsDependencies": ["cap-widget"]
          }
        }
      }
    }
  }
}
~~~

## 7. Backend-Verifikation prüfen

Das Frontend-Update ersetzt nicht die serverseitige Tokenprüfung. Jeder Token
muss genau einmal an den siteverify-Endpoint derselben Cap-Instanz geschickt
werden:

~~~http
POST https://<cap-instanz>/<site-key>/siteverify
Content-Type: application/json

{
  "secret": "<site-secret>",
  "response": "<captcha-token>"
}
~~~

Nur eine Antwort mit **{ "success": true }** darf als gültige Verifikation
behandelt werden. Das Site Secret darf niemals im Angular-Frontend liegen.

## 8. Migrationsprüfung

Vor dem Rollout sollten folgende Fälle getestet werden:

1. Das Widget wird mit dem neuen Endpoint dargestellt.
2. Ein erfolgreicher Solve setzt den Wert des Angular Form Controls.
3. Der Submit-Button bleibt bis zur erfolgreichen Verifikation deaktiviert.
4. form.reset() setzt Widget und Form Control zurück.
5. Ein deaktiviertes Form Control verhindert die Interaktion.
6. Fehler erscheinen über error beziehungsweise errorDetail.
7. Das Backend akzeptiert den Token einmal und lehnt ihn beim zweiten Versuch
   ab.
8. npm ci, Anwendungsbuild und Tests funktionieren im CI-System.

Weitere Informationen stehen im
[offiziellen Cap Guide](https://trycap.dev/guide/) und in der
[Paketdokumentation](projects/cap-angular-widget/README.md).

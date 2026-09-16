# CAP Angular Widget

Angular 21 workspace for
`@espressotutorialsgmbh/cap-angular-widget`, a standalone component around
the official [Cap widget](https://trycap.dev/guide/widget.html).

Package usage and API documentation are in the
[library README](projects/cap-angular-widget/README.md).

## Development

```bash
npm ci
npm test
npm run build
```

`npm run build` compiles both the publishable library and its demo
application. Start the demo with:

```bash
npm start
```

Replace the placeholder endpoint in the demo with a Cap Standalone endpoint in
the form `https://<your-instance>/<site-key>/`.

## Package

The production artifact is written to `dist/cap-angular-widget`. To inspect
the exact files before publishing:

```bash
cd dist/cap-angular-widget
npm pack --dry-run
```

## License

MIT

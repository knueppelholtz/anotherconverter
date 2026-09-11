# anotherconverter

Yes, another converter. A fast, local, open-source image converter — no uploads, no accounts, no nonsense.

Everything runs client-side in your browser. Files never leave your machine.

## Features

- Convert between **PNG, JPEG, WebP, AVIF, HEIC/HEIF, SVG and ICO**
- Drag & drop anywhere on the page, or click to browse
- Batch conversion with a "download all as ZIP" option
- No file size limits, no accounts, no tracking
- 100% client-side — no backend, no server-side processing

## Tech stack

- [SvelteKit](https://svelte.dev/) + Svelte 5 (runes)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [GSAP](https://gsap.com/) for the small UI animations
- [@jsquash/avif](https://github.com/jamsinclair/jSquash) for AVIF encoding (WASM)
- [heic-to](https://github.com/hoppergee/heic-to) for HEIC/HEIF decoding (WASM)
- [JSZip](https://stuk.github.io/jszip/) for the batch ZIP download

## Developing

Install dependencies and start a dev server:

```bash
npm install
npm run dev
```

## Building

```bash
npm run build
```

You can preview the production build with `npm run preview`.

## License

MIT — see [LICENSE](LICENSE).

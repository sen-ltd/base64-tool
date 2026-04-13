# Base64 Tool

Base64 encoder/decoder with UTF-8 text support, URL-safe (RFC 4648) variant, and file-to-data-URL conversion. Zero dependencies, no build step, runs in any modern browser.

**Live demo**: https://sen.ltd/portfolio/base64-tool/

## Features

- **Text mode** — encode/decode UTF-8 strings (supports Japanese and emoji)
- **File mode** — drop any file to get its Base64 data URL; shows image preview for image files
- **URL-safe variant** — RFC 4648 §5 (`-` and `_` instead of `+` and `/`, no padding)
- **Line wrap** — 76-character line breaks (MIME format)
- **Auto-detect** — heuristic to guess encode vs. decode direction from input
- **Size comparison** — original bytes vs. encoded characters with overhead %
- **Copy / Download / Clear / Swap** actions
- **Japanese / English UI** toggle
- **Dark / Light theme** (follows OS preference, toggleable)

## Manual Base64 implementation

`src/base64.js` implements Base64 without `atob`/`btoa` for educational clarity:

| Export | Description |
|---|---|
| `encode(bytes, urlSafe?)` | Uint8Array → Base64 string |
| `decode(str)` | Base64 string → Uint8Array (auto-detects URL-safe) |
| `encodeText(text, urlSafe?)` | UTF-8 string → Base64 string |
| `decodeText(str)` | Base64 string → UTF-8 string |
| `isBase64(str)` | Heuristic detection |
| `urlSafeToStandard(str)` | Convert URL-safe to standard with padding |
| `standardToUrlSafe(str)` | Convert standard to URL-safe, strip padding |
| `wrap(str, width?)` | Add line breaks every N chars (default 76) |
| `unwrap(str)` | Remove all whitespace |

## Setup

No install needed. Open `index.html` in a browser, or run a local server:

```sh
npm run serve   # python3 -m http.server 8080
```

## Tests

```sh
npm test
```

55 tests covering RFC 4648 known vectors, round-trips, UTF-8, URL-safe, wrap/unwrap.

## License

MIT © 2026 SEN LLC (SEN 合同会社)

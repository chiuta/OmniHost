# NOTICE / THIRD-PARTY

OmniHost is a single-file app (`index.html`). This file lists every third-party component that is **embedded** in it or shipped next to it, with version, author and license. Nothing is loaded from a CDN at run time.

OmniHost's own code is MIT-licensed (see `LICENSE`), Copyright (c) 2026 Alexandru-Ionuț Chiuță (Alexio).

## Embedded / bundled components

| Component | Version | Where | License | Copyright |
|---|---|---|---|---|
| jsQR | 1.4.0 | `vendor/jsQR.js` (QR scanning) | Apache-2.0 | Cosmo Wolfe (cozmo/jsQR) |
| JetBrains Mono (weights 300/400/500/700, latin + latin-ext, woff2, base64 in `index.html`) | 2.211 | fonts | SIL OFL 1.1 | 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) |
| DM Sans (weights 300/400/500/700, latin + latin-ext, woff2, base64) | 4.004 (gftools 0.9.30) | fonts | SIL OFL 1.1 | 2014 The DM Sans Project Authors (https://github.com/googlefonts/dm-fonts) |
| Playfair Display (weights 700/900, latin + latin-ext, woff2, base64) | 1.203 | fonts | SIL OFL 1.1 | 2017 The Playfair Display Project Authors (https://github.com/clauseggers/Playfair-Display), Reserved Font Name "Playfair Display" |
| fff-kit modules `core`, `dialog`, `label`, `bundle`, `search` | see `app.json` | inline scripts | MIT | 2026 Alexandru-Ionuț Chiuță (Alexio) - the author's own code |
| Trade-Free logo (JPEG, ~14 KB, base64) | - | footer / licenses page | license not specified by its source (TROM, https://trom.tf) | TROM - used as a badge, see https://trom.tf |

### jsQR
`vendor/jsQR.js` is byte-identical to `dist/jsQR.js` of the npm package `jsqr@1.4.0`
(sha256 `bc40c8a15196236b2314db0856f72ca0b49980cd5413b8c852a7349f5fee0859`).
Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0
Source: https://github.com/cozmo/jsQR

### Fonts (SIL Open Font License 1.1)
The fonts are embedded unmodified (only subset to latin/latin-ext and converted to woff2 by their upstream distribution). They are used under the SIL Open Font License, Version 1.1 (https://openfontlicense.org). The fonts are not sold on their own. The Reserved Font Name "Playfair Display" is not used for any modified font.

## Not third-party code (self-written)
- The QR code encoder, the Markdown renderer, the TOTP (RFC 6238) implementation and the master-password encryption (WebCrypto: PBKDF2-SHA256 600000 iterations, HKDF-SHA256, AES-256-GCM) are written for OmniHost. The QR encoder and Markdown parser were inspired by the public algorithms/designs of Nayuki's QR Code generator, qrcode.js and marked; no code was copied.
- `DecompressionStream`, `crypto.subtle`, `Intl` are native browser APIs.

## Online services (optional, not embedded)
Used only when the user opens the corresponding module; each is subject to its own terms:
- Open-Meteo (https://open-meteo.com) - weather data, CC BY 4.0 for the data.
- MyMemory (https://mymemory.translated.net) - translation.
- Free Dictionary API (https://dictionaryapi.dev) - dictionary.

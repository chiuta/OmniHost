# Jurnal de modificări — OmniHost

Format: [SemVer](https://semver.org/lang/ro/) (MAJOR.MINOR.PATCH). Istoricul complet al versiunilor anterioare este în secțiunea „Istoric / Changelog” din [README.ro.md](README.ro.md).

## 2.2.0 — 2026-10-27

### Adăugat
- Încărcare leneșă a pachetelor de limbă ale interfeței: din ~3,5 MB de script, ~2,3 MB erau traducerile în 72 de limbi (40 138 de chei, 39 699 de atribuiri `I18N['xx']['cheie']=…` împrăștiate prin cod, plus literalul `I18N`). Acum doar `en` rămâne cod; celelalte 71 de limbi sunt blocuri `<script type="application/json" id="oh-lp-xx">` inerte în același fișier, încărcate la prima citire a lui `I18N.xx` printr-un getter (`ohLazyI18N`), transparent pentru tot codul existent (inclusiv editorul de traduceri, `Object.keys(I18N)`, `DB._customI18N`). Un singur fișier, offline, fără rețea, fără `eval`; „Save” păstrează blocurile.
- Fișierul scade de la 5,45 MB la 4,04 MB; heap-ul JS la încărcare de la 8,4 la 4,8 MB (Chromium headless, container foarte încărcat: orientativ; DOMContentLoaded median ~9-9,5 s → ~4-6,5 s în aceleași condiții zgomotoase).
- Test nou `tests/lazy-i18n.test.mjs` (16 verificări): amprente ale tuturor celor 72 de limbi calculate pe fișierul 2.1.0 (chei, valori, ordinea cheilor identice), starea leneșă la pornire, schimbarea limbii, scrierea în limbi încărcate, copia salvată cu „Save” redeschisă, 0 cereri de rețea, 0 erori JS/CSP. Testele existente rulează neschimbate.

### Nu s-a implementat
- Încărcarea leneșă a codului modulelor propriu-zise (~0,7 MB de funcții), a dicționarului `UIX_DICT` (~0,2 MB) și a semințelor wiki (0,7 MB JSON): cer un încărcător pentru blocuri amânate și un audit al dependențelor dintre module (stare globală, lista albă `OH_ACT`) care nu s-a putut face în siguranță acum; planificat.
- Conținutul traducerilor nu s-a modificat; traducerile fr/it/es/pt/de/hu rămân automate, neverificate de vorbitori nativi.
- Verificat doar în Chromium headless.

## 2.1.0 — 2026-10-27

### Adăugat
- Tur ghidat opțional (butonul 🧭 din bara de sus): 6 pași care evidențiază bara laterală, spațiile de lucru, Ctrl/Cmd+K, tema și limba, Save și confidențialitatea. Nu salvează și nu trimite nimic; Esc îl închide; funcționează și pe ecran îngust. Texte în 8 limbi (traducerile fr/it/es/pt/de/hu sunt automate, neverificate de vorbitori nativi; în celelalte limbi ale interfeței apare engleza).
- Test nou `tests/tour.test.mjs` (38 de verificări: desktop și 360 px, tastatură, limbi, 0 cereri de rețea, date neschimbate).
- README: „Stare” și „Offline”, dimensiunea reală (~5,4 MB, cu descompunere aproximativă), notă că căutarea de module și spațiile de lucru existau deja.

### Nu s-a implementat
- Încărcarea leneșă a modulelor: cere împărțirea fișierului sau un strat de decompresie la rulare, ceea ce contrazice regula „un singur fișier, offline”; planificat, cu motivul în README.
- Căutarea de module: există deja (Ctrl/Cmd+K, din 1.3.1), neschimbată.

## 2.0.0 — 2026-10-26

Versiunea anterioară; vezi README.ro.md.

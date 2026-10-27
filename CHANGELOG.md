# Jurnal de modificări — OmniHost

Format: [SemVer](https://semver.org/lang/ro/) (MAJOR.MINOR.PATCH). Istoricul complet al versiunilor anterioare este în secțiunea „Istoric / Changelog” din [README.ro.md](README.ro.md).

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

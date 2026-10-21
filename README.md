# OmniHost

**English** · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Version:** 1.3.1 · **Last updated:** 2026-10-19

A personal productivity suite in a single HTML file ("quine"): notes, planner, finance, learning, tools and many modules, inspired by YunoHost.

**Live:** https://chiuta.github.io/OmniHost/

![Screenshot](screenshot.en.png)

## What it is

OmniHost is an `index.html` file (~4 MB) that works as a complete personal application, with no server and no account. The data is kept in a JSON object inside the file (`omnihost-store`); the "Save" button downloads a copy of the app with all the data embedded. The interface shows "141 Modules", and the description on the page calls it "Single-File Sovereignty". The default interface is in English.

## Features

The sidebars group the modules (with the number of items shown in the app):

- **Overview:** Dashboard (a card with greeting, clock, weather, quote, quick stats, calendar, tasks / Kanban, countdown, activity, "About OmniHost"), Life Stats, Stats, Export.
- **Create:** Writing Studio (Notes, Journal, Scratch, Blog, Meetings, Letters, Changelog, Knowledge, Citations, Editor, Prompts, Pipeline, Quotes).
- **Organize:** Planner (calendar, week, year, routines, meals, cleaning, sprint), Finance, People, Collections.
- **Productivity**, **Health**, **Learning** (including flashcards).
- **Tools:** Dev Toolkit, Creative Studio, Utilities (including dictionary and translation, QR generator and scanner), Documents.
- **Secure:** Security (including keys). **Meta:** Activity, Settings.
- Timelines (Universe, Galaxy, Solar System, geological, historical etc.) and a built-in wiki with module guides, in Notes.
- 30 visual themes and a "Custom Studio"; a dashboard edit mode (reordering by dragging, resizing).
- Interface in 71 languages, including Romanian.
- Quick module switcher (`Ctrl/Cmd+K`).
- JSON export / import, reset to "Clean Quine", source view and a "Licenses" page (credits for components, including jsQR and qrcodejs).

## New features (1.1.0)

- **Search in notes and journal** in the `Ctrl/Cmd+K` switcher: below the module list a section "In notes and journal" appears (BM25, typo tolerance, diacritics ignored); a click or Enter opens the note or journal entry.
- `.fff.json` backup (shared "fff-kit" module, local, no network): it opens from the dialog that appears when you click the version in the footer (export, password-encrypted export, import with confirmation, deletion of the app data). The backup covers the app database (`omnihost_db`); on import, the imported copy takes priority over the data in the file. An export marks the "last backup".
- The switcher dialog now has the dialog role (accessibility). The existing inline handlers were not modified.
- The texts of the switcher and of the notes/journal search (and the suffixes of the automatically generated accessible names) are available in 8 languages (ro, en, fr, it, es, pt, de, hu; the language is taken from the app settings); in the other languages of the interface they appear in English. The fr/it/es/pt/de/hu translations are automatic and **have not been verified by a native speaker.**
- `fff.config.json` marks the app as "self-modifying" (the Save button downloads a copy with the data embedded); the kit's dialog warns that the hash of the saved copy differs.

## User guide

1. Open `index.html`. On the Dashboard, go through the discovery tasks in the "Tasks" list.
2. Navigate between modules from the sidebar (☰ on narrow screens).
3. Change the language from the language selector in the top bar or from Settings.
4. Choose the theme from the "Theme" button (30 themes) or from "Custom Studio".
5. Add content in the modules ("+ Add" button; notes accept Markdown).
6. **To keep your data:** press "💾 Save" (or Settings → Save); a new HTML file is downloaded with all the data. Use that file from then on.
7. Backup: Settings → "Export JSON"; restore with the JSON import in Settings.
8. To reset the app and choose the language: Settings → "Clean Quine".
9. The dashboard cards can be reordered from "✏️ Edit Mode" (then "Done").

## Privacy and network

- **Storage:** the main data object is in the HTML file; in addition, `localStorage` uses the key `omnihost_db` (after "Save" it is rebuilt automatically, so that the `.fff.json` copy can include it). Unless you export it encrypted, the `.fff.json` copy contains the app's passwords and secrets as plain text: use the password-encrypted export.
- **Network:** the code contains a few third-party calls, limited by the CSP policy (`connect-src`) to four hosts; all of them go out only after an action of yours:
  - `geocoding-api.open-meteo.com` and `api.open-meteo.com` — the weather card on the Dashboard is **OFF by default**; on clicking "Show local weather" (opt-in, remembered in the settings in the file; it can be turned off with "Turn weather off"), the city deduced from the browser's time zone is sent for geocoding, then the coordinates for the forecast; the results are cached for 30 minutes. Without a click, no request goes out at load;
  - `api.dictionaryapi.dev` — only when you use the dictionary lookup (the searched word; possibly the pronunciation sound from the same host);
  - `api.mymemory.translated.net` — only when you use the translation in Utilities (the text to translate).
- **Passwords and secrets:** the Security/Passwords/TOTP modules keep the data as plain text in the JSON object in the file and in `localStorage` (`omnihost_db`); the "Encrypt" module is separate. The protection in the browser is only cosmetic (the note also appears on the Passwords page). The sample entries are public test credentials (the Stripe keys from the documentation were replaced with a placeholder). Do not store important passwords here on a shared computer and do not distribute the saved file.
- Links to other sites (e.g. github.com, trade-free.org, apps.yunohost.org) open only on click.
- No analytics, account or own server.

## Warning

A personal organization tool, for information only. The modules in the "Health" and "Finance" groups (symptom journal, allergies, supplements, financial calculators, tax estimator etc.) do not provide medical or financial advice and do not replace a specialist. The quotes and sample texts in the wiki are demonstration content and have not been checked for attribution.

## Running locally / offline

Download `index.html` (and the `vendor/` folder, which contains `jsQR.js` for the QR scanner) and open it in a browser. Almost all the modules work without internet; weather, dictionary and translation need a connection.

## License

MIT — see the LICENSE file. The "Licenses" page in the app, the file header and the wiki texts say the same (MIT). Third-party components (e.g. jsQR, qrcodejs) remain under their own licenses, listed on the "Licenses" page.

## Audit

2026-10-10: verified in the browser (0 JS errors; at that date there was an automatic request to Open-Meteo, now removed). Fixed a stored XSS (the `priority` fields of tasks and `module` of the feed) that could be triggered through a malicious JSON import, plus accessibility (names for controls, contrast, Markdown lists). Round 2 (2026-10-11): the license unified to CC0 (the "Licenses" page, wiki, flashcard); the weather on the Dashboard is now opt-in (no automatic request at load); the static text "nothing is sent anywhere" in the About card was aligned with the one in i18n; the Stripe test keys replaced with a placeholder.

## History / Changelog

- 1.3.1 — 2026-10-19: the quick module switcher (`Ctrl/Cmd+K`, the 🔍 button) with the search in notes and journal, the automatic accessible names for controls without a label and the "last backup" hooks of the `.fff.json` copy (all described above) are present in the current version: they had been removed by mistake in an earlier cleanup and were restored, with their texts now in 8 languages. Fixed: script hashes added to the page's CSP next to `'unsafe-inline'` made the browser block every inline handler (`onclick=` etc.); the hashes were removed and the CSP keeps `script-src 'self' 'unsafe-inline' blob:` as before.

- 1.1.0 — 2026-10-14: fuzzy search in notes and journal in `Ctrl/Cmd+K` (FFF.search); `.fff.json` copy through the shared modules (core, label, bundle, search); new tests: `tests/fff-r8.test.mjs`.

- 1.0.0 — 2026-10-12: the version and the date of the last update are shown in the app (first numbered version; in the sidebar, with a label translated into the 71 languages).

**Round 7 — 11 October 2026**.
- Fixed: on narrow screens, the donation banner covered the footer note in the opened sidebar (the warning "Personal organizer, informational only…"); the sidebar now has space at the bottom for the banner (and loses it if the banner is hidden).
- Verified, not reproduced: the delay of the `load` event offline (in the test, `load` fires at ~0.9 s, network blocked).
- Unchanged: the inline handlers remain (the reason from Round 6 holds).

**Round 6 — 11 October 2026**.
- New: quick module switcher — `Ctrl/Cmd+K` or the 🔍 button in the top bar; it searches among the 141 modules by name or group, navigation with ↑↓, Enter opens. The `Esc` key now closes any dialog.
- Encrypt / Decrypt: a visible state (with `aria-live`) below the output field for success/failure, not just a toast.
- The top bar breaks into two rows on narrow screens (it no longer cuts off the buttons); the content has space at the bottom for the donation button.
- Unchanged: the inline handlers (~1400) remain — the file is saved as a "quine" through `outerHTML`, and "minify" rewrites the script, so a hash-based CSP would invalidate the saved files.

**Round 5 — 11 October 2026**.
- Decrypting with a wrong password now empties the output field (the old text no longer remains).
- The donation message no longer covers the dashboard's edit button (the button was moved higher; the content has space at the bottom); the message is a `complementary` landmark.
- Accessibility: a name for the language selector, correct heading order in the calendar; axe-core = 0 violations at 1280 and 360 px.
- Unchanged: the 1377 inline handlers (`onclick=` etc.) remain; the quality of the translations into the 71 languages cannot be verified.

## Author

Alexio — Alexandru-Ionuț Chiuță. Contact: alexio@trom.tf

## Summary

OmniHost is a single-file "quine" personal productivity suite (notes, planner, finance, learning, tools, security and more; 30 themes; UI in 71 languages). Data lives inside the HTML file and in localStorage (`omnihost_db`); "Save" downloads a copy with data baked in. Network use is limited to Open-Meteo (dashboard weather, opt-in), dictionaryapi.dev (dictionary) and MyMemory (translation). MIT licence.

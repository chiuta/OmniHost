// Test: comutatorul Ctrl+K (r6), căutarea în notițe (r8) și numele accesibile (tf-a11y-labels) în 8 limbi.
// Rulare: node tests/restore-r6.test.mjs   (Playwright din /opt/node-tools, rețea blocată)
// [fff-portable] axe-core: FFF_AXE / AXE_PATH, apoi pachetul `axe-core` (npm i -D axe-core). Dacă lipsește: undefined (testele cu axe pică cu mesaj clar).
import {createRequire as __fffCR} from 'node:module';
const __fffAxe = () => process.env.FFF_AXE || process.env.AXE_PATH || (() => { try { return __fffCR(import.meta.url).resolve('axe-core/axe.min.js'); } catch { return undefined; } })();
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require = createRequire(process.env.PW_ROOT || import.meta.url);
const {chromium} = require('playwright');
const FILE = 'file://' + path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
const AXE = fs.readFileSync(process.env.FFF_AXE || __fffAxe(), 'utf8');
let ok = 0, bad = 0;
const check = (n, c, x) => { if (c) { ok++; console.log('  ok   ' + n); } else { bad++; console.log('  FAIL ' + n + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); } };
const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox']});
const seen = {};
for (const L of ['en', 'ro', 'fr', 'it', 'es', 'pt', 'de', 'hu']) {
  const ctx = await b.newContext({viewport: {width: 1280, height: 800}});
  const net = []; await ctx.route(/^https?:/, (r) => { net.push(r.request().url()); r.abort(); });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) errs.push('csp: ' + m.text().slice(0, 120)); });
  await page.goto(FILE); await page.waitForTimeout(1500);
  console.log('— ' + L);
  await page.evaluate((l) => { DB.settings.lang = l; DB.notes.push({id: 'rn1', title: 'Fundatia Cluj', tags: '', created: new Date().toISOString(), updated: new Date().toISOString(), body: 'betonul vine joi'}); persist(); applyI18n(); }, L);
  await page.waitForTimeout(600);
  await page.keyboard.press('Control+k');
  await page.waitForSelector('#oh-qs-in');
  const ph = await page.getAttribute('#oh-qs-in', 'placeholder');
  if (L === 'en') seen.ph = ph; else check(L + ': placeholder comutator tradus', ph !== seen.ph, ph);
  await page.fill('#oh-qs-in', 'fundatia'); await page.waitForTimeout(300);
  const h = await page.textContent('#oh-r8-h').catch(() => '');
  if (L === 'en') seen.h = h; else check(L + ': titlu secțiune notițe tradus', h && h !== seen.h, h);
  check(L + ': rezultat din notițe', (await page.$$('.oh-r8-item')).length >= 1);
  check(L + ': dialog cu rol (accesibilitate)', await page.evaluate(() => document.getElementById('modal-content').getAttribute('role') === 'dialog'));
  await page.keyboard.press('Escape');
  const st = await page.evaluate(() => {
    const unl = [...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter((e) => !(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.title || (e.labels && e.labels.length))).length;
    return {unl, btn: document.getElementById('oh-qs-btn').getAttribute('aria-label'), scripts: ['tf-a11y-labels', 'oh-r6-switcher', 'oh-r8-search'].every((i) => document.getElementById(i))};
  });
  check(L + ': scripturile restaurate prezente', st.scripts);
  check(L + ': 0 controale fără nume accesibil', st.unl === 0, st.unl);
  await page.evaluate(AXE);
  const ax = await page.evaluate(async () => { const r = await axe.run(document, {runOnly: {type: 'rule', values: ['label', 'select-name']}}); return r.violations.map((v) => v.id + ':' + v.nodes.length); });
  check(L + ': axe label/select-name 0', ax.length === 0, ax);
  check(L + ': fără pageerror/CSP, fără rețea', errs.length === 0 && net.length === 0, {errs, net});
  await ctx.close();
}
await b.close(); console.log(`\n${ok} ok, ${bad} eșuate`); process.exit(bad ? 1 : 0);

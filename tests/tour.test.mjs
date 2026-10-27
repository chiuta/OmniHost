// OmniHost 2.1.0 — tur ghidat (butonul 🧭): opt-in, doar DOM local, fără rețea, accesibil de la tastatură, utilizabil pe ecran îngust.
// Rulare: node tests/tour.test.mjs   (PW_ROOT=…/playwright/package.json dacă Playwright nu e local; rețea blocată)
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require = createRequire(process.env.PW_ROOT || import.meta.url);
const {chromium} = require('playwright');
const FILE = 'file://' + path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
let ok = 0, bad = 0;
const check = (n, c, x) => { if (c) { ok++; console.log('  ok   ' + n); } else { bad++; console.log('  FAIL ' + n + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); } };
const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox']});
async function open(vp) {
  const ctx = await b.newContext({viewport: vp});
  const net = []; await ctx.route(/^https?:/, (r) => { net.push(r.request().url()); r.abort(); });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message)); page.on('dialog', (d) => d.dismiss());
  page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) errs.push('csp: ' + m.text().slice(0, 120)); });
  await page.goto(FILE); await page.waitForTimeout(1500);
  return {ctx, page, net, errs};
}
const inView = (page) => page.evaluate(() => { const r = document.getElementById('oh-tour').getBoundingClientRect(); return r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5; });

// ---- desktop
let {ctx, page, net, errs} = await open({width: 1280, height: 800});
check('butonul 🧭 există, cu nume accesibil', await page.evaluate(() => { const e = document.getElementById('oh-tour-btn'); return !!e && /tour/i.test(e.getAttribute('aria-label')); }));
check('turul nu pornește singur', (await page.locator('#oh-tour').count()) === 0);
const dbBefore = await page.evaluate(() => JSON.stringify(DB));
await page.click('#oh-tour-btn');
check('dialogul turului apare (role=dialog, cu nume)', await page.evaluate(() => { const e = document.getElementById('oh-tour'); return !!e && e.getAttribute('role') === 'dialog' && /1 \/ 6/.test(e.getAttribute('aria-label')); }));
check('pasul 1 evidențiază bara laterală', await page.evaluate(() => document.getElementById('sidebar').classList.contains('oh-tour-hl')));
check('focusul e pe „Next”', await page.evaluate(() => document.activeElement && document.activeElement.id === 'oh-tour-next'));
check('dialogul încape în fereastră (pas 1)', await inView(page));
const wants = ['#oh-ws-btn', '#oh-qs-btn', '#theme-topbar-btn', '[data-act="saveQuine"]'];
for (let i = 0; i < wants.length; i++) {
  await page.keyboard.press('Enter'); // Enter pe „Next” (are focus)
  const s = await page.evaluate((sel) => ({hl: document.querySelector(sel).classList.contains('oh-tour-hl'), n: document.querySelectorAll('.oh-tour-hl').length, lab: document.getElementById('oh-tour').getAttribute('aria-label')}), wants[i]);
  check('pasul ' + (i + 2) + ' evidențiază ' + wants[i] + ' (și doar pe el)', s.hl && s.n === 1 && s.lab.includes((i + 2) + ' / 6'), s);
  check('dialogul încape în fereastră (pas ' + (i + 2) + ')', await inView(page));
}
await page.keyboard.press('Enter');
check('pasul 6 (confidențialitate): fără evidențiere, text despre rețea', await page.evaluate(() => document.querySelectorAll('.oh-tour-hl').length === 0 && /No account, no tracking/.test(document.getElementById('oh-tour').textContent)));
check('ultimul pas are butonul „Done”', await page.evaluate(() => document.getElementById('oh-tour-next').textContent === 'Done'));
await page.click('[data-oh-tour="back"]');
check('„Back” revine la pasul 5', await page.evaluate(() => /5 \/ 6/.test(document.getElementById('oh-tour').getAttribute('aria-label'))));
await page.click('#oh-tour-next'); await page.click('#oh-tour-next');
check('„Done” închide turul și scoate evidențierea', await page.evaluate(() => !document.getElementById('oh-tour') && document.querySelectorAll('.oh-tour-hl').length === 0));
check('focusul revine pe butonul 🧭', await page.evaluate(() => document.activeElement && document.activeElement.id === 'oh-tour-btn'));
await page.click('#oh-tour-btn'); await page.keyboard.press('Escape');
check('Esc închide turul', await page.evaluate(() => !document.getElementById('oh-tour') && document.querySelectorAll('.oh-tour-hl').length === 0));
await page.click('#oh-tour-btn'); await page.click('[data-oh-tour="close"]');
check('„Close tour” închide turul', await page.evaluate(() => !document.getElementById('oh-tour')));
check('turul nu modifică datele', (await page.evaluate(() => JSON.stringify(DB))) === dbBefore);
// limbi
await page.evaluate(() => { DB.settings.lang = 'ro'; }); await page.evaluate(() => ohTour.start());
check('română: titlu și butoane traduse', await page.evaluate(() => /Module, grupate/.test(document.getElementById('oh-tour').textContent) && document.getElementById('oh-tour-next').textContent === 'Înainte'));
await page.evaluate(() => { ohTour.stop(); DB.settings.lang = 'hu'; ohTour.start(); });
check('maghiară: text tradus', await page.evaluate(() => /Csoportosított modulok/.test(document.getElementById('oh-tour').textContent)));
await page.evaluate(() => { ohTour.stop(); DB.settings.lang = 'xx'; ohTour.start(); });
check('limbă fără traducere: engleză', await page.evaluate(() => /Modules, grouped/.test(document.getElementById('oh-tour').textContent)));
await page.evaluate(() => ohTour.stop());
check('0 cereri de rețea', net.length === 0, net);
check('0 erori JS / CSP', errs.length === 0, errs);
// spațiile de lucru și Ctrl+K încă funcționează
check('Ctrl+K încă deschide comutatorul', await (async () => { await page.keyboard.press('Control+k'); await page.waitForTimeout(300); const r = await page.locator('#oh-qs-in').count() === 1; await page.keyboard.press('Escape'); return r; })());
await ctx.close();

// ---- ecran îngust (telefon)
({ctx, page, net, errs} = await open({width: 360, height: 640}));
await page.click('#oh-tour-btn');
check('mobil: dialog ca foaie jos, în fereastră', await page.evaluate(() => document.getElementById('oh-tour').classList.contains('oh-tour-sheet')) && await inView(page));
check('mobil: pasul 1 evidențiază butonul ☰ (bara laterală e ascunsă)', await page.evaluate(() => document.querySelector('.topbar-toggle').classList.contains('oh-tour-hl') && !document.getElementById('sidebar').classList.contains('oh-tour-hl')));
for (let i = 0; i < 5; i++) { await page.keyboard.press('Enter'); check('mobil: pasul ' + (i + 2) + ' în fereastră', await inView(page)); }
await page.keyboard.press('Enter');
check('mobil: turul s-a încheiat', await page.evaluate(() => !document.getElementById('oh-tour')));
check('mobil: fără scroll orizontal', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
check('mobil: 0 cereri / erori', net.length === 0 && errs.length === 0, {net, errs});
await ctx.close(); await b.close();
console.log(`\ntour: ${ok} ok, ${bad} eșuate`); process.exit(bad ? 1 : 0);

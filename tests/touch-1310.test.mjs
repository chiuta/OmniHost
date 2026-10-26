// Teste v1.3.11 (23 oct. 2026): ținte tactile ≥44 px pe ecrane tactile (pointer:coarse), fără depășire orizontală, fără schimbare pe desktop.
// Rulare: node tests/touch-1310.test.mjs  (Playwright din /opt/node-tools, Chromium local, rețea blocată)
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'module';
const require = createRequire(process.env.PW_ROOT || import.meta.url);
const {chromium} = require('playwright');
const URL_APP = 'file://' + path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
let pass = 0, fail = 0;
const ok = (c, n, i) => { if (c) { pass++; console.log('  ok   ' + n); } else { fail++; console.log('  FAIL ' + n + (i === undefined ? '' : ' ' + JSON.stringify(i))); } };
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox']});
async function run(touch) {
  const ctx = await browser.newContext({viewport: {width: 390, height: 800}, hasTouch: touch, isMobile: touch});
  await ctx.route(/^https?:/, r => r.abort());
  const p = await ctx.newPage(); await p.goto(URL_APP); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    const out = {nav: 0, minH: 1e9, ov: document.documentElement.scrollWidth};
    const items = [...document.querySelectorAll('.nav-item')]; out.nav = items.length;
    items.forEach(x => { out.minH = Math.min(out.minH, parseFloat(getComputedStyle(x).minHeight) || 0); });
    return out;
  });
  await ctx.close(); return r;
}
const t = await run(true), d = await run(false);
ok(t.nav > 0, 'meniul are elemente', t);
ok(t.minH >= 44, 'ecran tactil: .nav-item min-height ≥ 44', t);
ok(t.ov <= 390, 'ecran tactil: fără depășire orizontală', t);
ok(d.minH < 44, 'desktop: regula nu se aplică', d);
await browser.close();
console.log(`\n${pass} ok, ${fail} eșuate`); process.exit(fail ? 1 : 0);

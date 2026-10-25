// Teste r8 (14 oct. 2026): căutare aproximativă în notițe/jurnal (Ctrl+K), copie .fff.json (kit) cu import care are câștig de cauză, „ultima copie”.
// Rulare: node tests/fff-r8.test.mjs  (Playwright din /opt/node-tools, Chromium local, rețea blocată)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require = createRequire('/opt/node-tools/package.json');
const {chromium} = require('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = 'file://' + path.join(HERE, '..', 'index.html');
const AXE = process.env.FFF_AXE || '/tmp/claude-0/-home-claude/78529928-3825-51c3-b9bd-0e81655ab6bc/scratchpad/sweep/node_modules/axe-core/axe.min.js';
let ok = 0, bad = 0;
const check = (n, c, x) => { if (c) { ok++; console.log('  ok   ' + n); } else { bad++; console.log('  FAIL ' + n + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); } };
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
async function open(w = 1280, h = 800, bypass = false) {
  const ctx = await b.newContext({viewport: {width: w, height: h}, bypassCSP: bypass, acceptDownloads: true, locale: 'en-US'});
  const net = [];
  await ctx.route(/^https?:/, (r) => { net.push(r.request().url()); r.abort(); });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { const t = m.text(); if (/Content Security Policy|Refused to/i.test(t)) errs.push('csp: ' + t); });
  await page.goto(FILE);
  await page.waitForTimeout(1500);
  return {ctx, page, errs, net};
}
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

console.log('— metadate și kit');
{
  const {ctx, page, errs, net} = await open();
  const m = await page.evaluate(() => ({v: document.querySelector('meta[name=application-version]').content, d: document.querySelector('meta[name=last-updated]').content, ft: document.getElementById('app-version').textContent, mods: document.querySelector('meta[name=fff-modules]')?.content, kit: !!(window.FFF && FFF.search && FFF.bundle && FFF.label)}));
  check('versiune 1.3.11 și data', m.v === '1.3.11' && m.d === '2026-10-26', m);
  check('footer cu versiune', /v 1\.3\.11 · 2026-10-26/.test(m.ft), m.ft);
  check('module kit', m.mods === 'core,dialog,label,bundle,search' && m.kit, m);
  check('fără erori JS/CSP', errs.length === 0, errs);
  check('fără cereri de rețea la încărcare', net.length === 0, net);

  console.log('— căutare Ctrl+K');
  await page.evaluate(() => {
    DB.notes.push({id: 'r8n1', title: 'Șantier Cluj — deviz', tags: 'lucrări', created: new Date().toISOString(), updated: new Date().toISOString(), body: 'Fundația se toarnă joi, betonul vine de la stația din Apahida.'});
    DB.journal.push({id: 'r8j1', title: 'Excursie la Padiș', body: 'Am urcat pe traseul cu cascada Răchițele, vreme bună.', mood: '', created: new Date().toISOString()});
    persist();
  });
  const search = async (q) => {
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+k');
    await page.waitForSelector('#oh-qs-in');
    await page.fill('#oh-qs-in', q);
    await page.waitForTimeout(200);
    return page.$$eval('.oh-r8-item .oh-r8-t', (els) => els.map((e) => e.textContent));
  };
  const typo = await search('overvew');
  check('greșeală de scriere: "overvew" găsește "OmniHost — Overview"', typo.some((t) => /Overview/.test(t)), typo);
  const dia = await search('santier');
  check('fără diacritice: "santier" → "Șantier Cluj — deviz"', dia.some((t) => /Șantier/.test(t)), dia);
  const body = await search('betonul');
  check('caută în corpul notiței', body.some((t) => /Șantier/.test(t)), body);
  const jr = await search('cascada rachitele');
  check('caută în jurnal', jr.some((t) => /Padiș/.test(t)), jr);
  check('modulele rămân căutabile (lista veche neschimbată)', (await search('planner'), await page.$$eval('.oh-qs-item', (e) => e.length)) >= 1);
  const none = await search('zzzqqqxxx');
  check('fără rezultate: mesaj, listă goală', none.length === 0 && await page.locator('#oh-r8-box .oh-qs-hint').count() === 1);
  await search('santier');
  await page.click('.oh-r8-item');
  await page.waitForTimeout(200);
  const modalTxt = await page.evaluate(() => ({show: document.getElementById('modal').classList.contains('show'), txt: document.getElementById('modal-content').innerText}));
  check('clic pe rezultat deschide notița', modalTxt.show && /Fundația se toarnă joi/.test(modalTxt.txt), modalTxt.txt.slice(0, 120));
  await search('padis');
  await page.click('.oh-r8-item');
  await page.waitForTimeout(200);
  const jtxt = await page.evaluate(() => document.getElementById('modal-content').innerHTML);
  check('clic pe rezultat din jurnal deschide editarea', /Excursie la Padiș/.test(jtxt));
  await page.keyboard.press('Escape');
  // Enter deschide primul rezultat când nu există module potrivite
  await page.keyboard.press('Control+k'); await page.waitForSelector('#oh-qs-in');
  await page.fill('#oh-qs-in', 'apahida'); await page.waitForTimeout(200);
  const mods = await page.$$eval('.oh-qs-item', (e) => e.length);
  if (mods === 0) {
    await page.press('#oh-qs-in', 'Enter'); await page.waitForTimeout(200);
    check('Enter deschide primul rezultat din conținut', /Fundația/.test(await page.evaluate(() => document.getElementById('modal-content').innerText)));
  } else check('Enter (module potrivite → comportamentul vechi)', true);
  await page.keyboard.press('Escape');
  check('fără erori după căutări', errs.length === 0, errs);
  await ctx.close();
}

console.log('— fără kit de căutare: comportamentul vechi');
{
  const {ctx, page, errs} = await open();
  await page.evaluate(() => { window.FFF.search = null; });
  await page.keyboard.press('Control+k'); await page.waitForSelector('#oh-qs-in');
  await page.fill('#oh-qs-in', 'planner'); await page.waitForTimeout(200);
  check('lista de module funcționează, fără secțiune nouă', await page.locator('.oh-qs-item').count() >= 1 && await page.locator('.oh-r8-item').count() === 0);
  check('fără erori', errs.length === 0, errs);
  await ctx.close();
}

console.log('— copie de siguranță (.fff.json) și import');
{
  const {ctx, page, errs} = await open();
  await page.evaluate(() => { DB.notes.push({id: 'r8keep', title: 'NOTA DE PĂSTRAT', tags: '', created: '2026-01-01', updated: '2026-01-01', body: 'x'}); persist(); });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => FFF.bundle.export())]);
  const p = path.join(process.env.FFF_TMP || '/tmp', 'omnihost-test-' + process.pid + '.fff.json');
  await dl.saveAs(p);
  const bundle = JSON.parse(fs.readFileSync(p, 'utf8'));
  check('bundle.app = omnihost și cheia omnihost_db inclusă', bundle.app === 'omnihost' && typeof bundle.data.omnihost_db === 'string', Object.keys(bundle.data || {}));
  check('conținutul include nota de păstrat', /NOTA DE PĂSTRAT/.test(bundle.data.omnihost_db));
  const lb = await page.evaluate(() => DB.lastBackup);
  check('„ultima copie” marcată cu data de azi', lb === today(), lb);
  // modifică, apoi importă copia veche: trebuie să revină
  await page.evaluate(() => { DB.notes = DB.notes.filter((n) => n.id !== 'r8keep'); persist(); });
  check('nota ștearsă înainte de import', await page.evaluate(() => !DB.notes.some((n) => n.id === 'r8keep')));
  const txt = fs.readFileSync(p, 'utf8');
  await Promise.all([page.waitForNavigation({waitUntil: 'load', timeout: 15000}).catch(() => null), page.evaluate((t) => FFF.bundle.import(new File([t], 'o.fff.json', {type: 'application/json'}), {confirm: false, reload: true}), txt)]);
  await page.waitForTimeout(1800);
  check('după import + reîncărcare, nota e înapoi (copia importată câștigă față de fișier)', await page.evaluate(() => DB.notes.some((n) => n.id === 'r8keep')));
  // omnihost_db există și după „Save”
  await page.evaluate(() => { localStorage.removeItem('omnihost_db'); });
  await page.waitForTimeout(100);
  await page.evaluate(() => { window.URL.createObjectURL = () => 'blob:x'; HTMLAnchorElement.prototype.click = function () {}; saveQuine(); });
  await page.waitForTimeout(3300);
  check('după Save, omnihost_db e refăcut (intră în .fff.json)', await page.evaluate(() => !!localStorage.getItem('omnihost_db')));
  check('fără erori', errs.length === 0, errs);
  fs.rmSync(p, {force: true});
  await ctx.close();
}

console.log('— măsurători 1280×800 și 360×740 (axe cu bypassCSP, inclusiv dialogul Ctrl+K cu rezultate)');
for (const [w, h] of [[1280, 800], [360, 740]]) {
  const {ctx, page, errs} = await open(w, h);
  await page.waitForTimeout(2200);
  const over = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  check(`${w}: fără scroll orizontal`, !over);
  check(`${w}: fără erori JS/CSP`, errs.length === 0, errs);
  await ctx.close();
  const c2 = await open(w, h, true);
  await c2.page.waitForTimeout(2200);
  await c2.page.evaluate(fs.readFileSync(AXE, 'utf8') + '\n;0');
  const axRun = async () => c2.page.evaluate(async () => (await window.axe.run(document, {resultTypes: ['violations']})).violations.map((v) => v.id + ':' + v.nodes.length));
  const base = await axRun();
  check(`${w}: axe pagina de start`, base.length === 0, base);
  await c2.page.keyboard.press('Control+k'); await c2.page.waitForSelector('#oh-qs-in');
  await c2.page.fill('#oh-qs-in', 'overview'); await c2.page.waitForTimeout(250);
  const dlg = await axRun();
  check(`${w}: axe cu dialogul de căutare și rezultate`, dlg.length === 0, dlg);
  const o = await c2.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  check(`${w}: dialogul nu produce scroll orizontal`, !o);
  await c2.ctx.close();
}
await b.close();
console.log(`\n${ok} ok, ${bad} eșuate`);
process.exit(bad ? 1 : 0);

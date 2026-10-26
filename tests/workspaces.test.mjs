// OmniHost 2.0.0 — spații de lucru (profiluri de module) și bara de comenzi extinsă (Ctrl+K: spații + date locale).
// Rulare: node tests/workspaces.test.mjs   (Playwright din /opt/node-tools, rețea blocată)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require = createRequire(process.env.PW_ROOT || import.meta.url);
const {chromium} = require('playwright');
const FILE = 'file://' + path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
const AXE = process.env.FFF_AXE || process.env.AXE_PATH ? fs.readFileSync(process.env.FFF_AXE || process.env.AXE_PATH, 'utf8') : '';
let ok = 0, bad = 0;
const check = (n, c, x) => { if (c) { ok++; console.log('  ok   ' + n); } else { bad++; console.log('  FAIL ' + n + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); } };
const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox']});
const ctx = await b.newContext({viewport: {width: 1280, height: 800}});
const net = []; await ctx.route(/^https?:/, (r) => { net.push(r.request().url()); r.abort(); });
if (AXE) await ctx.addInitScript({content: AXE});
const page = await ctx.newPage(); const errs = [], dlgs = [];
page.on('pageerror', (e) => errs.push(e.message)); page.on('dialog', (d) => { dlgs.push(d.message()); d.dismiss(); });
page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) errs.push('csp: ' + m.text().slice(0, 120)); });
await page.goto(FILE); await page.waitForTimeout(1500);
const vis = () => page.evaluate(() => [...document.querySelectorAll('.nav-item[data-page^="mega-"]')].filter(b => b.style.display !== 'none').map(b => b.dataset.page.replace('mega-', '')));

check('butonul de spațiu de lucru există și arată „All modules”', await page.evaluate(() => /All modules/.test(document.getElementById('oh-ws-btn').textContent)), await page.textContent('#oh-ws-btn'));
const all = await vis(); check('implicit: toate cele 16 pagini sunt vizibile', all.length === 16, all);

// --- activare preset
await page.evaluate(() => ohWorkspaces.apply('school'));
let v = await vis();
check('Școală: ascunde Dev Toolkit, Finance, Security etc.', !v.includes('devtools') && !v.includes('finance') && !v.includes('security') && v.includes('learning') && v.includes('dashboard') && v.includes('admin'), v);
let st = await page.evaluate(() => ({a: DB.workspaces.active, h: DB.hiddenModules.slice().sort(), ls: JSON.parse(localStorage.getItem('omnihost_db')).workspaces.active}));
check('starea se salvează (DB + localStorage)', st.a === 'school' && st.ls === 'school' && st.h.includes('mega-devtools'), st);
check('eticheta butonului arată spațiul activ', /School/.test(await page.textContent('#oh-ws-btn')));
await page.reload(); await page.waitForTimeout(1500);
v = await vis(); check('după reîncărcare spațiul rămâne', !v.includes('devtools') && /School/.test(await page.textContent('#oh-ws-btn')), v);

// --- pagina curentă ascunsă → dashboard
await page.evaluate(() => { ohWorkspaces.apply('all'); location.hash = '#snippets'; }); await page.waitForTimeout(400);
await page.evaluate(() => ohWorkspaces.apply('school')); await page.waitForTimeout(500);
check('dacă pagina curentă dispare din spațiu, se trece la Dashboard', await page.evaluate(() => location.hash === '#dashboard'), await page.evaluate(() => location.hash));

// --- Ctrl+K: spații + module filtrate + date locale
await page.evaluate(() => {
  ohWorkspaces.apply('all');
  DB.tasks.push({id: 'tk1', title: 'Cumpărat cafea măcinată pentru birou', done: false});
  DB.contacts.push({id: 'ct1', name: 'Ștefan Brâncuși', email: 'stefan@example.org', notes: 'electrician'});
  DB.recipes.push({id: 'rc1', name: 'Papanași cu smântână', desc: 'desert'});
  DB.passwords.push({id: 'pw1', site: 'banca-secreta.example', user: 'cafea-user', password: 'cafea-parola-123'});
  DB.symptoms.push({id: 'sy1', name: 'cafea simptom', note: 'x'});
  persist();
});
await page.keyboard.press('Control+k'); await page.waitForSelector('#oh-qs-in');
check('bara de comenzi listează spațiile de lucru', await page.evaluate(() => document.querySelectorAll('#oh-v2-box [data-ws]').length >= 4));
await page.fill('#oh-qs-in', 'cafea'); await page.waitForTimeout(300);
const r1 = await page.evaluate(() => [...document.querySelectorAll('#oh-v2-box .oh-v2-go')].map(b => b.textContent));
check('caută în datele locale (sarcini)', r1.some(t => /Cumpărat cafea/.test(t)), r1);
check('NU caută în parole și date de sănătate', !r1.some(t => /banca|cafea-user|parola|simptom/i.test(t)), r1);
await page.fill('#oh-qs-in', 'stefan brancusi'); await page.waitForTimeout(300);
const r2 = await page.evaluate(() => [...document.querySelectorAll('#oh-v2-box .oh-v2-go')].map(b => b.textContent));
check('potrivire fără diacritice (contacte)', r2.some(t => /Ștefan/.test(t)), r2);
await page.click('#oh-v2-box .oh-v2-go'); await page.waitForTimeout(500);
check('clic pe rezultat deschide modulul și închide bara', await page.evaluate(() => location.hash === '#contacts' && !document.getElementById('modal').classList.contains('show')), await page.evaluate(() => location.hash));
await page.keyboard.press('Control+k'); await page.waitForSelector('#oh-qs-in');
await page.fill('#oh-qs-in', 'papanasi'); await page.waitForTimeout(300);
await page.keyboard.press('Enter'); await page.waitForTimeout(500);
check('Enter deschide primul rezultat din date', await page.evaluate(() => location.hash === '#recipes'), await page.evaluate(() => location.hash));
await page.keyboard.press('Control+k'); await page.waitForSelector('#oh-qs-in');
await page.fill('#oh-qs-in', 'zzzzqqqq'); await page.waitForTimeout(300);
check('fără potrivire: mesaj explicit', await page.evaluate(() => /No match in local data/.test(document.getElementById('oh-v2-box').textContent)));
check('nota despre ce nu se caută e afișată', await page.evaluate(() => /Passwords, secure notes and health data/.test(document.getElementById('oh-v2-box').textContent)));
// activare spațiu din bara de comenzi
await page.fill('#oh-qs-in', 'office'); await page.waitForTimeout(200);
await page.click('#oh-v2-box [data-ws="office"]'); await page.waitForTimeout(300);
v = await vis(); check('activare „Office” din Ctrl+K', !v.includes('learning') && v.includes('devtools') && !(await page.evaluate(() => document.getElementById('modal').classList.contains('show'))), v);
// modulele din spații ascunse nu apar în comutator
await page.keyboard.press('Control+k'); await page.waitForSelector('#oh-qs-in');
await page.fill('#oh-qs-in', 'flashcards'); await page.waitForTimeout(250);
const sw = await page.evaluate(() => document.querySelectorAll('.oh-qs-item').length);
check('comutatorul de module nu listează module din pagini ascunse (Learning)', sw === 0, sw);
await page.keyboard.press('Escape');

// --- spațiu propriu
await page.evaluate(() => ohWorkspaces.apply('all'));
await page.evaluate(() => { DB.hiddenModules = ['mega-creative', 'mega-health']; persist(); });
await page.click('#oh-ws-btn'); await page.waitForSelector('#oh-ws-root');
check('modalul spațiilor are rol de dialog', await page.evaluate(() => document.getElementById('modal-content').getAttribute('role') === 'dialog'));
check('eticheta marchează modificarea manuală (*)', /\*/.test(await page.textContent('#oh-ws-btn')));
await page.fill('#oh-ws-name', 'Minimal'); await page.click('#oh-ws-save'); await page.waitForTimeout(200);
st = await page.evaluate(() => DB.workspaces.custom.map(c => [c.name, c.hidden.slice().sort().join()]));
check('salvează vizibilitatea curentă ca spațiu propriu', st.length === 1 && st[0][0] === 'Minimal' && st[0][1] === 'mega-creative,mega-health', st);
await page.fill('#oh-ws-name', 'minimal'); await page.click('#oh-ws-save');
check('nume duplicat respins', await page.evaluate(() => DB.workspaces.custom.length === 1));
if (AXE) { const ax = await page.evaluate(async () => { const r = await axe.run(document.getElementById('modal-content'), {runOnly: {type: 'rule', values: ['label', 'button-name', 'aria-allowed-attr', 'aria-required-attr']}}); return r.violations.map(v => v.id + ':' + v.nodes.length); }); check('axe: etichete și ARIA în dialogul spațiilor', ax.length === 0, ax); }
await page.keyboard.press('Escape'); await page.evaluate(() => ohWorkspaces.apply('school'));
await page.click('#oh-ws-btn'); await page.waitForSelector('#oh-ws-root');
await page.click('#oh-ws-list [data-ws="all"]');
await page.waitForTimeout(200);
await page.click('#oh-ws-list [data-ws]:has-text("Minimal")'); await page.waitForTimeout(200);
v = await vis(); check('activarea spațiului propriu ascunde exact ce a salvat', !v.includes('creative') && !v.includes('health') && v.includes('devtools'), v);
await page.click('[data-wsdel]'); st = await page.evaluate(() => DB.workspaces.custom.length);
check('ștergerea cere confirmare (primul clic nu șterge, fără dialog nativ)', st === 1 && dlgs.length === 0, st);
await page.click('[data-wsdel]'); st = await page.evaluate(() => ({n: DB.workspaces.custom.length, a: DB.workspaces.active}));
check('al doilea clic șterge; spațiul activ revine la „all”', st.n === 0 && st.a === 'all', st);
await page.keyboard.press('Escape');

// --- 8 limbi
const labels = {};
for (const L of ['ro', 'en', 'fr', 'it', 'es', 'pt', 'de', 'hu']) {
  await page.evaluate((l) => { DB.settings.lang = l; ohWorkspaces.apply('home'); }, L); await page.waitForTimeout(150);
  await page.keyboard.press('Control+k'); await page.waitForSelector('#oh-qs-in');
  const t = await page.evaluate(() => ({btn: document.getElementById('oh-ws-btn').textContent, h: (document.getElementById('oh-v2-hw') || {}).textContent, items: [...document.querySelectorAll('#oh-v2-box [data-ws]')].map(x => x.textContent)}));
  labels[L] = t.btn;
  check(L + ': UI spații tradus, fără „undefined”', t.h && t.h.length > 3 && !/undefined|\[object/.test(JSON.stringify(t)) && t.items.length >= 4, t);
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
}
check('etichetele diferă între limbi (ro ≠ en ≠ de)', labels.ro !== labels.en && labels.en !== labels.de, labels);
check('doar rețea blocată: nicio cerere externă reușită', net.length === 0, net.slice(0, 3));
check('fără dialoguri native', dlgs.length === 0, dlgs);
check('fără erori JS/CSP', errs.length === 0, errs);
await b.close(); console.log(`\nOmniHost workspaces: ${ok} ok, ${bad} eșuate`); process.exit(bad ? 1 : 0);

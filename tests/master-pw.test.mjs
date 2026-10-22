// Teste v1.3.9 (22 oct. 2026): (1) fără handlere inline + CSP fără 'unsafe-inline' + delegare de evenimente;
// (2) parola principală opțională: criptare AES-GCM (PBKDF2 600000, sare/IV per câmp) pentru parole, TOTP și seif;
// (3) dialoguri în pagină (fără alert/confirm/prompt native); (4) NOTICE.md.
// Rulare: node tests/master-pw.test.mjs  (Playwright din /opt/node-tools, Chromium local, rețea blocată)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require = createRequire('/opt/node-tools/package.json');
const {chromium} = require('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const FILE = 'file://' + path.join(ROOT, 'index.html');
const SRC = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let ok = 0, bad = 0;
const check = (n, c, x) => { if (c) { ok++; console.log('  ok   ' + n); } else { bad++; console.log('  FAIL ' + n + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); } };
const LANGS = ['en', 'ro', 'fr', 'it', 'es', 'pt', 'de', 'hu'];
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
async function open(opts = {}) {
  const ctx = await b.newContext({viewport: {width: 1280, height: 800}, acceptDownloads: true, locale: 'en-US'});
  if (opts.ls) await ctx.addInitScript((v) => { try { if (!localStorage.getItem('omnihost_db')) localStorage.setItem('omnihost_db', v); } catch (e) {} }, opts.ls);
  const net = [];
  await ctx.route(/^https?:/, (r) => { net.push(r.request().url()); r.abort(); });
  const page = await ctx.newPage();
  const errs = [], natives = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { const t = m.text(); if (/Content Security Policy|Refused to/i.test(t)) errs.push('csp: ' + t.slice(0, 160)); });
  page.on('dialog', (d) => { natives.push(d.type() + ':' + d.message()); d.dismiss().catch(() => {}); });
  await page.goto(FILE);
  await page.waitForTimeout(1200);
  return {ctx, page, errs, natives, net};
}
const SECRET = 'S3cret!pw-ÎȘț', TOTP = 'JBSWY3DPEHPK3PXP', VAULT = 'Pașaport: 123456789', MASTER = 'cal verde bate-n geam 7';
const seed = () => `(() => {
  DB.passwords = [{id: 'p1', title: 'Mail', username: 'ion', password: ${JSON.stringify(SECRET)}, url: '', created: ''}, {id: 'p2', title: 'Banca', username: 'ana', password: ${JSON.stringify(SECRET)}, url: '', created: ''}];
  DB.totpKeys = [{id: 't1', name: 'GitHub', secret: '${TOTP}', issuer: '', created: ''}];
  DB.vaultEntries = [{id: 'v1', title: 'Pașaport', category: 'Identity', icon: '📄', data: ${JSON.stringify(VAULT)}, created: ''}];
  persist();
})()`;
const stored = (page) => page.evaluate(() => (localStorage.getItem('omnihost_db') || '') + '\n' + document.getElementById('omnihost-store').textContent);
async function fillDialog(page, text, accept = true) {
  await page.waitForSelector('dialog[data-fff-dialog] input, dialog[data-fff-dialog] textarea', {timeout: 8000});
  if (text != null) await page.fill('dialog[data-fff-dialog] input, dialog[data-fff-dialog] textarea', text);
  await page.click(accept ? 'dialog[data-fff-dialog] button.fff-primary' : 'dialog[data-fff-dialog] button:not(.fff-primary)');
}

console.log('— sursă: fără handlere inline, CSP strict');
{
  const inl = (SRC.match(/\son[a-z]+\s*=\s*["']/g) || []).length;
  check('0 atribute on*="…" în sursă (HTML static și șabloane JS)', inl === 0, inl);
  const csp = /Content-Security-Policy" content="([^"]*)"/.exec(SRC)[1];
  const ss = /script-src([^;]*)/.exec(csp)[1];
  check("script-src fără 'unsafe-inline', cu hash-uri", !/'unsafe-inline'/.test(ss) && /'sha256-/.test(ss), ss.trim());
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'fff.config.json'), 'utf8'));
  check('fff.config.json fără excepția script-unsafe-inline', !JSON.stringify(cfg).includes('script-unsafe-inline'), cfg);
  const hashes = [...ss.matchAll(/'sha256-([^']+)'/g)].map((m) => m[1]);
  check('un hash pentru fiecare script inline executabil', hashes.length >= 4, hashes.length);
}

console.log('— delegare de evenimente');
{
  const {ctx, page, errs} = await open();
  const r = await page.evaluate(() => {
    const out = {};
    window.__pwn = 0; window.__order = [];
    OH_ACT.__t1 = function () { window.__order.push('copil'); event.stopPropagation(); };
    OH_ACT.__t2 = function () { window.__order.push('părinte'); };
    OH_ACT.__t3 = function (a) { window.__order.push('arg:' + a[0] + ':' + a[1]); return false; };
    const box = document.createElement('div');
    box.innerHTML = '<div data-act="__t2" id="__p"><button data-act="__t1" id="__c">c</button></div><a href="#zz" data-act="__t3" data-a1="x &amp; y" data-a2="2" id="__a">a</a><button id="__e" data-act="eval" data-a1="window.__pwn=1">e</button><button id="__f" data-act="constructor" data-a1="window.__pwn=2">f</button><input id="__i" data-act-input="__t3" data-input-a1="q" data-input-a2="9">';
    document.body.appendChild(box);
    document.getElementById('__c').click();
    document.getElementById('__a').click();
    document.getElementById('__e').click();
    document.getElementById('__f').click();
    const i = document.getElementById('__i'); i.value = 'zz'; i.dispatchEvent(new Event('input', {bubbles: true}));
    out.order = window.__order.slice(); out.pwn = window.__pwn; out.hash = location.hash;
    delete OH_ACT.__t1; delete OH_ACT.__t2; delete OH_ACT.__t3; box.remove();
    return out;
  });
  check('stopPropagation în copil oprește handlerul părintelui; argumentele data-aN ajung la funcție', JSON.stringify(r.order) === JSON.stringify(['copil', 'arg:x & y:2', 'arg:q:9']), r.order);
  check('return false din handler anulează acțiunea implicită (link-ul nu navighează)', r.hash !== '#zz', r.hash);
  check('lista albă: data-act="eval"/"constructor" nu execută nimic', r.pwn === 0, r.pwn);
  check('fără erori JS/CSP', errs.length === 0, errs);
  await ctx.close();
}

console.log('— dialoguri în pagină (fără confirm/prompt nativ)');
{
  const {ctx, page, errs, natives} = await open();
  await page.evaluate(() => { DB.feeds = [{id: 'f1', text: 'x', page: 'notes', time: ''}]; DB.notes.push({id: 'dn1', title: 'Rămâne', tags: '', created: '', updated: '', body: 'b'}); persist(); });
  await page.evaluate(() => goTo('settings'));
  await page.waitForTimeout(200);
  await page.click('[data-act="resetDataAsk"]');
  await page.waitForSelector('dialog[data-fff-dialog="confirm"]');
  const msg = await page.textContent('dialog[data-fff-dialog="confirm"] .fff-msg');
  check('„Erase ALL data” deschide un dialog în pagină, tradus', /Erase ALL data/.test(msg), msg);
  await page.click('dialog[data-fff-dialog="confirm"] button:not(.fff-primary)');
  await page.waitForTimeout(150);
  let n = await page.evaluate(() => DB.notes.some((x) => x.id === 'dn1'));
  check('Anulează: datele rămân', n === true);
  await page.click('[data-act="resetDataAsk"]');
  await page.waitForSelector('dialog[data-fff-dialog="confirm"]');
  await page.click('dialog[data-fff-dialog="confirm"] button.fff-primary');
  await page.waitForTimeout(300);
  n = await page.evaluate(() => DB.notes.some((x) => x.id === 'dn1'));
  check('Confirmă: datele sunt șterse', n === false);
  check('niciun dialog nativ', natives.length === 0, natives);
  // ro
  await page.evaluate(() => { DB.settings.lang = 'ro'; applyI18n(); DB.feeds = [{id: 'f2', text: 'x', page: 'notes', time: ''}]; });
  await page.evaluate(() => clearAllFeed());
  await page.waitForSelector('dialog[data-fff-dialog="confirm"]');
  const mro = await page.textContent('dialog[data-fff-dialog="confirm"] .fff-msg');
  check('mesajul dialogului urmează limba aplicației (ro)', /Ștergi tot fluxul/.test(mro), mro);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  check('fără erori JS/CSP', errs.length === 0, errs);
  await ctx.close();
}

console.log('— parola principală: activare, criptare la repaus, deblocare');
let KEEP = null;
{
  const {ctx, page, errs, natives} = await open();
  await page.evaluate(seed());
  const code0 = await page.evaluate((s) => generateTOTP(s), TOTP);
  // activare prin interfață
  await page.evaluate(() => goTo('settings'));
  await page.waitForSelector('#mp-card');
  const st0 = await page.textContent('#mp-status');
  check('card în Setări, stare „off”', /off/i.test(st0), st0);
  await page.click('[data-act="mpEnableAsk"]');
  await page.fill('#mp-new', 'scurt');
  await page.fill('#mp-new2', 'scurt');
  await page.click('#mp-go');
  check('parolă prea scurtă: respinsă', /at least 8/.test(await page.textContent('#mp-msg')));
  await page.fill('#mp-new', MASTER);
  await page.fill('#mp-new2', MASTER + 'x');
  await page.click('#mp-go');
  check('parole diferite: respinse', /do not match/.test(await page.textContent('#mp-msg')));
  await page.fill('#mp-new2', MASTER);
  await page.click('#mp-go');
  await page.waitForFunction(() => !!DB.settings.mp, null, {timeout: 60000});
  await page.waitForTimeout(300);
  const info = await page.evaluate(() => ({
    cfg: DB.settings.mp, pw: DB.passwords.map((p) => p.password), tk: DB.totpKeys[0].secret, vd: DB.vaultEntries[0].data,
    unlocked: ohMpUnlocked(), title: DB.passwords.map((p) => p.title), user: DB.passwords[0].username
  }));
  check('configurație: PBKDF2-SHA256, 600000 iterații, sare de 16 B, verificator criptat', info.cfg.kdf === 'PBKDF2-SHA256' && info.cfg.it === 600000 && atob(info.cfg.salt).length === 16 && info.cfg.ver.startsWith('ohmp1:'), info.cfg);
  check('parole, TOTP și seif sunt text cifrat (ohmp1:)', info.pw.every((x) => x.startsWith('ohmp1:')) && info.tk.startsWith('ohmp1:') && info.vd.startsWith('ohmp1:'));
  check('titlul și utilizatorul rămân în clar (nu sunt câmpuri sensibile)', info.title[0] === 'Mail' && info.user === 'ion');
  check('două parole identice au text cifrat diferit (sare/IV per câmp)', info.pw[0] !== info.pw[1]);
  const parts = await page.evaluate(() => [DB.passwords[0].password, DB.passwords[1].password, DB.totpKeys[0].secret, DB.vaultEntries[0].data].map((s) => { const u = atob(s.slice(6)); return {len: u.length, salt: btoa(u.slice(0, 16)), iv: btoa(u.slice(16, 28))}; }));
  check('fiecare câmp: sare 16 B + IV 12 B + etichetă GCM', parts.every((p) => p.len >= 28 + 16));
  check('sărurile și IV-urile sunt toate distincte', new Set(parts.map((p) => p.salt)).size === 4 && new Set(parts.map((p) => p.iv)).size === 4);
  const raw = await stored(page);
  check('în localStorage/fișier nu există parola, secretul TOTP, datele din seif sau parola principală', !raw.includes(SECRET) && !raw.includes(TOTP) && !raw.includes('123456789') && !raw.includes(MASTER) && !raw.includes('Pașaport: '), raw.length);
  check('după activare modulul rămâne deblocat în sesiune', info.unlocked === true);
  await page.evaluate(() => goTo('passwords'));
  await page.waitForTimeout(300);
  await page.click('[data-act="togglePw"]');
  const shown = await page.textContent('#pw-p1');
  check('lista de parole: „arată” → parola în clar (din cache de sesiune)', shown === SECRET, shown);
  await page.evaluate(() => goTo('totp'));
  await page.waitForTimeout(300);
  const code1 = (await page.textContent('#totp-code-t1')).trim();
  check('TOTP: același cod ca înainte de criptare (6 cifre)', /^\d{6}$/.test(code1) && (code1 === code0 || code1 === await page.evaluate((s) => generateTOTP(s), TOTP)), [code0, code1]);
  // copia kitului
  const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => FFF.bundle.export())]);
  const p1 = path.join('/tmp', 'oh-mp-' + process.pid + '.fff.json');
  await dl.saveAs(p1);
  const kit = fs.readFileSync(p1, 'utf8'); fs.rmSync(p1, {force: true});
  check('copia necriptată a kitului: fără text în clar, câmpurile rămân criptate cu parola principală', !kit.includes(SECRET) && !kit.includes(TOTP) && !kit.includes('123456789') && /ohmp1:/.test(kit));
  // Blocare
  await page.evaluate(() => goTo('settings'));
  await page.click('[data-act="mpLockNow"]');
  await page.evaluate(() => goTo('passwords'));
  await page.waitForTimeout(300);
  check('după „Blochează acum” modulul cere parola', await page.evaluate(() => ohMpUnlocked()) === false);
  await page.keyboard.press('Escape').catch(() => {});
  KEEP = await page.evaluate(() => localStorage.getItem('omnihost_db'));
  check('fără dialoguri native', natives.length === 0, natives);
  check('fără erori JS/CSP', errs.length === 0, errs);
  await ctx.close();
}

console.log('— sesiune nouă: parola principală se cere la prima accesare');
{
  const {ctx, page, errs} = await open({ls: KEEP});
  check('după reîncărcare: activ și blocat (cheia nu s-a păstrat)', await page.evaluate(() => ohMpOn() && !ohMpUnlocked()));
  await page.evaluate(() => goTo('passwords'));
  await page.waitForSelector('dialog[data-fff-dialog="prompt"]', {timeout: 8000});
  check('la deschiderea modulului apare solicitarea parolei principale (câmp de tip parolă)', await page.getAttribute('dialog[data-fff-dialog="prompt"] input', 'type') === 'password');
  await fillDialog(page, 'parola-gresita-123');
  await page.waitForFunction(() => /Wrong master password/.test(document.body.innerText), null, {timeout: 60000});
  check('parolă greșită: mesaj + rămâne blocat', await page.evaluate(() => !ohMpUnlocked()));
  await page.waitForSelector('dialog[data-fff-dialog="prompt"] input');
  await fillDialog(page, MASTER);
  await page.waitForFunction(() => ohMpUnlocked(), null, {timeout: 60000});
  await page.waitForTimeout(400);
  check('parolă corectă: lista de parole se afișează', await page.evaluate(() => document.querySelectorAll('#passwords-list [data-act="togglePw"]').length === 2));
  check('parola principală nu a ajuns în stocare', !(await stored(page)).includes(MASTER));
  // editare + salvare
  await page.click('#passwords-list [data-act="modalEditPw"]');
  await page.waitForSelector('#m-pw-p');
  check('formularul de editare arată parola decriptată', await page.inputValue('#m-pw-p') === SECRET);
  await page.fill('#m-pw-p', 'NOUA-parola-9!');
  await page.click('#modal .btn-primary');
  await page.waitForFunction(() => ohSecGet('passwords', DB.passwords[0], 'password') === 'NOUA-parola-9!', null, {timeout: 10000});
  const raw = await stored(page);
  check('după salvare: parola nouă e criptată la repaus', !raw.includes('NOUA-parola-9!') && DB_startsEnc(await page.evaluate(() => DB.passwords[0].password)));
  // adăugare parolă nouă
  await page.evaluate(() => modalPassword());
  await page.fill('#m-pw-t', 'Nou'); await page.fill('#m-pw-p', 'alta-parola-77');
  await page.click('#modal .btn-primary');
  await page.waitForFunction(() => DB.passwords.length === 3, null, {timeout: 10000});
  check('parolă adăugată: criptată', DB_startsEnc(await page.evaluate(() => DB.passwords[2].password)));
  // seif
  await page.evaluate(() => goTo('datavault'));
  await page.waitForTimeout(300);
  await page.click('#datavault-ui [data-act="vaultReveal"]');
  await page.waitForTimeout(200);
  check('seif: „arată” → conținutul decriptat', (await page.textContent('#modal-content')).includes('123456789'));
  await page.evaluate(() => closeModal());
  // TOTP nou
  await page.evaluate(() => modalTOTP());
  await page.fill('#totp-name', 'Alt cont'); await page.fill('#totp-secret', 'GEZDGNBVGY3TQOJQ');
  await page.evaluate(() => saveTOTP());
  await page.waitForFunction(() => DB.totpKeys.length === 2, null, {timeout: 10000});
  check('cheie TOTP nouă: secretul e criptat', DB_startsEnc(await page.evaluate(() => DB.totpKeys[1].secret)) && !(await stored(page)).includes('GEZDGNBVGY3TQOJQ'));
  // manipulare: un octet modificat în text cifrat
  const tam = await page.evaluate(async (m) => {
    const orig = DB.vaultEntries[0].data;
    const u = atob(orig.slice(6)).split(''); u[40] = String.fromCharCode(u[40].charCodeAt(0) ^ 1);
    DB.vaultEntries[0].data = 'ohmp1:' + btoa(u.join(''));
    ohMpLock(false);
    const ok = await ohMpUnlock(m);
    const tampered = ohSecGet('vaultEntries', DB.vaultEntries[0], 'data');
    const other = ohSecGet('passwords', DB.passwords[1], 'password');
    let changeErr = null; try { await ohMpChange(m, 'alta parola lunga 12'); } catch (e) { changeErr = e.name; }
    DB.vaultEntries[0].data = orig;
    return {ok, tampered, other, changeErr, stillMaster: !!(await ohMpCheck(m))};
  }, MASTER).catch((e) => ({err: String(e)}));
  check('text cifrat modificat: autentificarea GCM îl respinge (null), celelalte câmpuri rămân utilizabile', tam.ok === true && tam.tampered === null && tam.other === SECRET, tam);
  check('schimbarea parolei se oprește (nimic modificat) dacă un câmp nu poate fi citit', tam.changeErr === 'OperationError' && tam.stillMaster === true, tam);
  check('fără erori JS/CSP', errs.length === 0, errs);
  KEEP = await page.evaluate(() => localStorage.getItem('omnihost_db'));
  await ctx.close();
}
function DB_startsEnc(v) { return typeof v === 'string' && v.startsWith('ohmp1:'); }

console.log('— schimbarea și dezactivarea parolei principale');
{
  const {ctx, page, errs} = await open({ls: KEEP});
  await page.evaluate(async (m) => { await ohMpUnlock(m); }, MASTER);
  const before = await page.evaluate(() => DB.passwords.map((p) => p.password).join('|'));
  const wrong = await page.evaluate(() => ohMpChange('gresita-gresita', 'parola noua 12345'));
  check('schimbare cu parola curentă greșită → -1, nimic modificat', wrong === -1 && before === await page.evaluate(() => DB.passwords.map((p) => p.password).join('|')));
  // prin interfață
  await page.evaluate(() => goTo('settings'));
  await page.click('[data-act="mpChangeAsk"]');
  await page.fill('#mp-cur', MASTER); await page.fill('#mp-new', 'PAROLA-NOUĂ-lungă-55'); await page.fill('#mp-new2', 'PAROLA-NOUĂ-lungă-55');
  await page.click('#mp-go');
  await page.waitForFunction(() => /re-encrypted|Fields re-encrypted/.test(document.body.innerText), null, {timeout: 60000});
  const after = await page.evaluate(() => DB.passwords.map((p) => p.password).join('|'));
  check('parola schimbată: toate câmpurile re-criptate (valori diferite)', after !== before);
  const chk = await page.evaluate(async (m) => ({old: !!(await ohMpCheck(m[0])), nw: !!(await ohMpCheck(m[1]))}), [MASTER, 'PAROLA-NOUĂ-lungă-55']);
  check('parola veche nu mai funcționează, cea nouă da', chk.old === false && chk.nw === true, chk);
  const vals = await page.evaluate(() => ({p0: ohSecGet('passwords', DB.passwords[0], 'password'), t: generateTOTP(ohSecGet('totpKeys', DB.totpKeys[0], 'secret'))}));
  check('după schimbare datele se decriptează la fel', vals.p0 === 'NOUA-parola-9!' && /^\d{6}$/.test(vals.t), vals);
  // dezactivare
  await page.click('[data-act="mpDisableAsk"]');
  await page.fill('#mp-cur', 'gresita-gresita');
  await page.click('#mp-go');
  await page.waitForFunction(() => /Wrong master password/.test(document.getElementById('mp-msg').textContent), null, {timeout: 60000});
  check('dezactivare cu parolă greșită: respinsă, rămâne criptat', await page.evaluate(() => ohMpOn()));
  await page.fill('#mp-cur', 'PAROLA-NOUĂ-lungă-55');
  await page.click('#mp-go');
  await page.waitForFunction(() => !ohMpOn(), null, {timeout: 60000});
  await page.waitForTimeout(300);
  const raw = await stored(page);
  check('după dezactivare: câmpurile sunt din nou în clar, configurația a dispărut', raw.includes('NOUA-parola-9!') && raw.includes(TOTP) && !raw.includes('ohmp1:') && !/"mp":/.test(raw));
  await page.evaluate(() => goTo('passwords'));
  await page.waitForTimeout(300);
  check('modulul se deschide fără solicitare', await page.evaluate(() => !document.querySelector('dialog[data-fff-dialog]') && document.querySelectorAll('#passwords-list [data-act="togglePw"]').length === 3));
  check('fără erori JS/CSP', errs.length === 0, errs);
  await ctx.close();
}

console.log('— migrare din clar, câmpuri rămase în clar, import');
{
  const {ctx, page, errs} = await open();
  await page.evaluate(seed());
  await page.evaluate(async (m) => { await ohMpEnable(m); }, MASTER);
  // un câmp apare în clar în timp ce parola e activă (ex. import parțial): la deblocare se criptează
  await page.evaluate(() => { ohMpLock(false); DB.passwords.push({id: 'p9', title: 'Rămas', username: 'x', password: 'in-clar-123', url: '', created: ''}); persist(); });
  await page.evaluate(async (m) => { await ohMpUnlock(m); }, MASTER);
  const raw = await stored(page);
  check('câmpul rămas în clar a fost criptat la deblocare', !raw.includes('in-clar-123') && await page.evaluate(() => ohSecGet('passwords', DB.passwords[2], 'password')) === 'in-clar-123');
  // export JSON + import: câmpurile criptate trec neschimbate, modulul cere parola
  const exported = await page.evaluate(() => JSON.stringify(DB));
  check('exportul JSON nu conține parole în clar', !exported.includes(SECRET) && !exported.includes(TOTP));
  await page.evaluate((t) => { const inp = {files: [new File([t], 'd.json', {type: 'application/json'})], value: ''}; importJSON(inp); }, exported);
  await page.waitForTimeout(600);
  check('după import: parola principală activă și blocată (sesiune curățată)', await page.evaluate(() => ohMpOn() && !ohMpUnlocked()));
  check('fără erori JS/CSP', errs.length === 0, errs);
  await ctx.close();
}

console.log('— mesaje în 8 limbi');
{
  const {ctx, page, errs} = await open();
  const keys = await page.evaluate(() => Object.fromEntries(Object.entries(OH_MSG).map(([l, o]) => [l, Object.keys(o).sort().join(',')])));
  check('aceleași chei în toate cele 8 limbi', LANGS.every((l) => keys[l] === keys.en), Object.keys(keys));
  const dif = await page.evaluate(() => { const en = OH_MSG.en; const r = {}; for (const l of Object.keys(OH_MSG)) { if (l === 'en') continue; r[l] = Object.keys(en).filter((k) => OH_MSG[l][k] === en[k]); } return r; });
  check('nicio traducere identică cu engleza (în afara terminologiei comune)', LANGS.filter((l) => l !== 'en').every((l) => dif[l].length === 0), dif);
  const seen = new Set();
  for (const L of LANGS) {
    await page.evaluate((l) => { DB.settings.lang = l; applyI18n(); goTo('settings'); }, L);
    await page.waitForSelector('#mp-card');
    const t = await page.textContent('#mp-card h3');
    seen.add(t);
    const bad = await page.evaluate(() => /undefined|mp_[a-z]/.test(document.getElementById('mp-card').textContent));
    check(L + ': cardul din Setări tradus, fără chei brute', !bad && t.length > 4, t);
  }
  check('8 titluri distincte', seen.size === 8, [...seen]);
  check('fără erori JS/CSP', errs.length === 0, errs);
  await ctx.close();
}

console.log('— NOTICE');
{
  const nt = fs.existsSync(path.join(ROOT, 'NOTICE.md')) ? fs.readFileSync(path.join(ROOT, 'NOTICE.md'), 'utf8') : '';
  check('NOTICE.md există și numește jsQR 1.4.0 (Apache-2.0), JetBrains Mono, DM Sans, Playfair Display (OFL-1.1)', /jsQR/.test(nt) && /1\.4\.0/.test(nt) && /Apache-2\.0/.test(nt) && /JetBrains Mono/.test(nt) && /DM Sans/.test(nt) && /Playfair Display/.test(nt) && /OFL/.test(nt));
  const vend = fs.readFileSync(path.join(ROOT, 'vendor', 'jsQR.js'));
  const { createHash } = await import('node:crypto');
  check('NOTICE.md conține sha256 al vendor/jsQR.js', nt.includes(createHash('sha256').update(vend).digest('hex')));
  for (const f of ['README.md', 'README.ro.md', 'README.fr.md', 'README.it.md', 'README.es.md', 'README.pt.md', 'README.de.md', 'README.hu.md']) {
    check(f + ' trimite la NOTICE.md', /NOTICE\.md/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
  }
}

await b.close();
console.log(`\n${ok} ok, ${bad} eșuate`);
process.exit(bad ? 1 : 0);

// OmniHost 2.2.0 — încărcare leneșă a pachetelor de limbă (I18N). Conținutul tuturor celor 72 de limbi trebuie să fie IDENTIC cu cel din 2.1.0.
// Amprentele de mai jos (sha256, primele 16 hex, ale JSON.stringify(I18N[limbă]), cu ordinea cheilor) au fost calculate pe fișierul 2.1.0, înainte de transformare.
// Rulare: node tests/lazy-i18n.test.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require = createRequire(process.env.PW_ROOT || import.meta.url);
const {chromium} = require('playwright');
const FILE = 'file://' + path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
let ok = 0, bad = 0;
const check = (n, c, x) => { if (c) { ok++; console.log('  ok   ' + n); } else { bad++; console.log('  FAIL ' + n + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); } };
const ORDER = ["en", "ro", "fr", "es", "it", "pt", "af", "am", "ar", "bg", "bn", "bs", "ca", "cs", "cy", "da", "de", "el", "eo", "et", "eu", "fa", "fi", "ga", "gl", "ha", "he", "hi", "hr", "hu", "hy", "id", "ig", "is", "ja", "ka", "km", "ko", "la", "lb", "lo", "lt", "lv", "mk", "ml", "mn", "ms", "mt", "my", "ne", "nl", "no", "pl", "ru", "si", "sk", "sl", "sq", "sr", "sv", "sw", "ta", "te", "th", "tl", "tr", "uk", "ur", "vi", "yo", "zh", "zu"];
const HASH = {en:"14f32a9f6e000f99",ro:"6f5cb31daa14644e",fr:"c72fcaca8f2f3758",es:"42abd53b33e9c470",it:"4f6b0a79957a6c58",pt:"17e8201e5be37b82",af:"99378bbf2c5fd0d4",am:"ab6f67ebe3567b0f",ar:"dabc3d1492e50b6b",bg:"993c1bed50748117",bn:"881e7fb9428262d7",bs:"635c7d0498832e7e",ca:"7af21f7026825119",cs:"aae808c22e36c48d",cy:"ee2a1c29ebdd3d65",da:"98337370b75e1642",de:"346ea7ecfef0acee",el:"7ad2e4ac56aaf0a3",eo:"0d9a8e2365212ddc",et:"8773869bb0ff0d13",eu:"0b7b1a23a1b47876",fa:"d6ce643f86011223",fi:"65a28625cdde66b7",ga:"73191f6fb58fdcf5",gl:"035f0598a474c5b9",ha:"1ceae600c096d0a0",he:"210694ba40e3351d",hi:"5cac026544fdd668",hr:"64f05e51b9614599",hu:"5ba272f738aa0b14",hy:"55a87a742b6c0749",id:"40d1c8e571ad1cb3",ig:"bc05791691e465b0",is:"6a9d292ea578ebaf",ja:"ee87aba42784053a",ka:"ccb70a1a7a2d3f6e",km:"8b0be656da903ed3",ko:"e742f3a904f0cf5a",la:"b52b4336e33d8f5a",lb:"b9f4b2b1a48e408d",lo:"c3da651e067963f1",lt:"3b4fc9b75bbada55",lv:"f9e9c47bb060090f",mk:"ef7c4ffbd2c083c9",ml:"e13c96560201dbee",mn:"e1b4a66322f1a374",ms:"e35f746bcdd1ebce",mt:"ad89cf72e81ed40a",my:"a34df65b9effc408",ne:"1cfed19994ba5709",nl:"b8cd308a9096ec7e",'no':"326872744fe751c3",pl:"d81aa43fb03560b1",ru:"73a0eff45a04c166",si:"dd99a2be16b87259",sk:"df612339b4321b2f",sl:"40930562ba1d34e6",sq:"c2dffd3439eb2587",sr:"cc238f227592f7a2",sv:"fa593debb3389d97",sw:"77cbc79e0add9db3",ta:"82de941ace71ae2e",te:"e117e42367e0550d",th:"c87af4aaa7f46be9",tl:"af96d39a9f980b79",tr:"a593be6c1c3fbb74",uk:"733434240c79d5c1",ur:"57f4ce4f50e34310",vi:"14e164f13b6d4c3b",yo:"c5a0a9f8f5066649",zh:"5911c491965c41b8",zu:"7ce413da1b6203c2"};
const KEYS = {en:574,ro:574,fr:574,es:574,it:574,pt:574,af:565,am:564,ar:489,bg:548,bn:497,bs:565,ca:565,cs:565,cy:565,da:564,de:574,el:555,eo:565,et:565,eu:565,fa:488,fi:565,ga:565,gl:565,ha:565,he:561,hi:497,hr:565,hu:574,hy:562,id:565,ig:565,is:565,ja:563,ka:565,km:565,ko:564,la:565,lb:565,lo:559,lt:565,lv:565,mk:547,ml:497,mn:562,ms:565,mt:565,my:564,ne:498,nl:565,'no':565,pl:565,ru:562,si:563,sk:565,sl:565,sq:565,sr:543,sv:565,sw:565,ta:565,te:564,th:559,tl:565,tr:565,uk:554,ur:488,vi:565,yo:565,zh:564,zu:565};
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox']});
const ctx = await b.newContext({viewport: {width: 1280, height: 800}, acceptDownloads: true});
const net = []; await ctx.route(/^https?:/, (r) => { net.push(r.request().url()); r.abort(); });
const page = await ctx.newPage(); const errs = [];
page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) errs.push('csp: ' + m.text().slice(0, 120)); });
await page.goto(FILE); await page.waitForTimeout(1500);

// 1. stare la pornire: doar 'en' (și eventual limba curentă) sunt încărcate; restul sunt încă „leneșe”
const st = await page.evaluate(() => { const lazy = [], eager = []; for (const l of Object.keys(I18N)) (Object.getOwnPropertyDescriptor(I18N, l).get ? lazy : eager).push(l); return {lazy: lazy.length, eager, packs: document.querySelectorAll('script[type="application/json"][id^="oh-lp-"]').length, lang: DB.settings.lang}; });
check('71 de pachete de limbă în fișier (blocuri JSON inerte)', st.packs === 71, st.packs);
check('la pornire sunt încărcate doar en (și limba curentă); restul leneșe', st.eager.includes('en') && st.eager.length <= 2 && st.lazy >= 70, st);
check('ordinea limbilor în Object.keys(I18N) neschimbată', JSON.stringify(await page.evaluate(() => Object.keys(I18N))) === JSON.stringify(ORDER));
check('pachetele nu conțin </script sau <!-- (se citesc ca text inert)', await page.evaluate(() => [...document.querySelectorAll('script[id^="oh-lp-"]')].every((e) => !/<\/script|<!--/i.test(e.textContent) && JSON.parse(e.textContent) && typeof JSON.parse(e.textContent) === 'object')));

// 2. citirea unei limbi o încarcă, o singură dată, și rezultatul e un obiect obișnuit
const one = await page.evaluate(() => { const before = !!Object.getOwnPropertyDescriptor(I18N, 'ja').get; const a = I18N.ja, b = I18N.ja; const d = Object.getOwnPropertyDescriptor(I18N, 'ja'); return {before, same: a === b, data: !d.get && d.writable && d.enumerable, n: Object.keys(a).length, v: a.dashboard}; });
check('I18N.ja: leneș înainte, apoi proprietate obișnuită (același obiect)', one.before && one.same && one.data, one);
check('I18N.ja are ' + KEYS.ja + ' chei', one.n === KEYS.ja, one.n);

// 3. schimbarea limbii în aplicație (ca selectorul din Setări)
await page.evaluate(() => { DB.settings.lang = 'ko'; DB.settings._langManuallySet = true; applyI18n(); renderPage(); });
await page.waitForTimeout(300);
const ko = await page.evaluate(() => ({t: t('dashboard'), v: I18N.ko.dashboard, lazy: !!Object.getOwnPropertyDescriptor(I18N, 'ko').get}));
check('după schimbarea limbii în ko, t() întoarce textul coreean și pachetul e încărcat', ko.t === ko.v && !ko.lazy && ko.t !== 'Dashboard', ko);
await page.evaluate(() => { DB.settings.lang = 'ro'; applyI18n(); renderPage(); });
check('la ro: textul românesc', await page.evaluate(() => t('dashboard') === I18N.ro.dashboard && I18N.ro.dashboard !== 'Dashboard'));

// 4. scriere: atribuire de cheie și înlocuirea unei limbi întregi (editorul de traduceri face asta)
const wr = await page.evaluate(() => { I18N.fr.__test_key = 'x'; const a = I18N.fr.__test_key; delete I18N.fr.__test_key; I18N.de = {a: 'b'}; const d = I18N.de.a; const c = Object.keys(I18N.pl).length; return {a, d, c}; });
check('scriere într-o limbă încărcată / înlocuire completă prin setter', wr.a === 'x' && wr.d === 'b' && wr.c === KEYS.pl, wr);

// 5. conținutul tuturor celor 72 de limbi identic cu 2.1.0 (amprente), după reîncărcarea paginii (stare curată)
await page.goto(FILE); await page.waitForTimeout(1200);
const all = await page.evaluate(() => { const o = {}; for (const l of Object.keys(I18N)) o[l] = JSON.stringify(I18N[l]); return o; });
const bad2 = ORDER.filter((l) => sha(all[l]) !== HASH[l]);
check('toate cele 72 de limbi: conținut și ordinea cheilor IDENTICE cu 2.1.0', bad2.length === 0 && Object.keys(all).length === 72, bad2.slice(0, 8));
check('număr total de chei = ' + Object.values(KEYS).reduce((a, c) => a + c, 0), ORDER.reduce((a, l) => a + Object.keys(JSON.parse(all[l])).length, 0) === Object.values(KEYS).reduce((a, c) => a + c, 0));

// 6. „Save” păstrează pachetele (copia salvată rămâne un fișier unic, funcțional offline)
await page.evaluate(() => { DB.settings.lang = 'sv'; });
const [dl] = await Promise.all([page.waitForEvent('download', {timeout: 20000}), page.evaluate(() => saveQuine())]);
const tmp = path.join(os.tmpdir(), 'oh-lazy-' + process.pid + '.html'); await dl.saveAs(tmp);
const saved = fs.readFileSync(tmp, 'utf8');
const nsaved = (saved.match(/<script type="application\/json" id="oh-lp-[a-z]{2}">\{/g) || []).length; check('copia salvată conține cele 71 de pachete', nsaved === 71, [nsaved, saved.length]);
const p2 = await ctx.newPage(); await p2.goto('file://' + tmp); await p2.waitForTimeout(1500);
const all2 = await p2.evaluate(() => { const o = {}; for (const l of Object.keys(I18N)) o[l] = JSON.stringify(I18N[l]); return o; });
check('copia salvată, redeschisă, are aceleași 72 de limbi', ORDER.every((l) => sha(all2[l]) === HASH[l]));
check('copia salvată: limba suedeză aplicată, fără erori', await p2.evaluate(() => t('dashboard') === I18N.sv.dashboard) );
fs.rmSync(tmp);
check('fără cereri de rețea', net.length === 0, net);
check('fără erori JS / CSP', errs.length === 0, errs);
await b.close();
console.log(`\nOmniHost lazy-i18n: ${ok} ok, ${bad} eșuate`); process.exit(bad ? 1 : 0);

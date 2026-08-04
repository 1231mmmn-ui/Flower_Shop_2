/**
 * 一年（20日）に、どれだけ**読ませ、押させる**かを数える。
 *
 *   node tools/tempo.mjs [ポート]
 *
 * ── 時計で測らない理由 ──────────────────────────────────
 *
 * 機械に遊ばせて秒を測ると、待ち時間の設定値をなぞるだけになります。
 * 人がかける時間は「読む字数」と「押す回数」でほぼ決まるので、
 * そちらを数えて、読む速さを添えて換算します。
 *
 * ── 花の紙だけは、数え方が違う ────────────────────────────
 *
 * 花の紙（名前・花言葉・ひとこと・旬・用途・相性）は約130字あり、
 * 一日15回開くので、素直に数えると**一日の半分**がここになります。
 * でも人は、はじめて会う花のときだけ全部読みます。
 * 二度目からは名前と花言葉を見て取るだけ ── 20字ほど。
 * だから「はじめて会う29種ぶん」を一年に一度だけ足します。
 */
import { chromium } from 'playwright';

const PORT = process.argv[2] ?? '4321';
const URL = `http://localhost:${PORT}/`;

/** その日ごとの組数（src/data/visits.ts と同じ式）。 */
function roll(day, salt) {
  const x = Math.sin(day * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}
const visitsForDay = (day) => 3 + Math.floor(roll(day, 17) * 3);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const cat = {};
let taps = 0;
const read = async (name, sel) => {
  const t = await p.locator(sel).allTextContents();
  cat[name] = (cat[name] ?? 0) + t.join('').replace(/\s/g, '').length;
};
const tap = async (locator) => { taps += 1; await locator.click({ timeout: 8000, force: true }); };
const w = (ms) => p.waitForTimeout(ms);

await p.goto(URL, { waitUntil: 'networkidle' });
await p.evaluate(() => localStorage.setItem('flower-shop-hanasaku:v1', JSON.stringify({
  day: 2, earnings: 0, library: {}, favorites: [], memories: [], hintsDone: ['inspect'], soundOn: false })));
await p.reload({ waitUntil: 'networkidle' });
await w(1200);

await tap(p.getByRole('button', { name: '扉を押す' })); await w(1500);
await read('市場', '.market__head, .market__stall, .market__foot');
await tap(p.locator('.market__stall').nth(1)); await w(500);
await tap(p.getByRole('button', { name: 'この花を店頭に飾る' })); await w(1400);
await read('開店前', '.morning__name');
await tap(p.getByRole('button', { name: 'お店を開く' })); await w(1400);

let guests = 0;
let cardFull = 0;
for (let i = 0; i < 6; i += 1) {
  guests += 1;
  await read('挨拶', '.greet__entrance, .greet__words, .greet__note');
  await tap(p.getByRole('button', { name: 'わかりました' })); await w(800);
  for (const k of [0, 2, 4]) {
    await tap(p.locator('.shop-view .stand').nth(k)); await w(500);
    if (cardFull === 0) await read('花の紙（はじめて）', '.detail__name, .detail__meanings, .detail__note, .detail__rows');
    cardFull += 1;
    await read('花の紙（二度目から）', '.detail__name, .detail__meanings');
    await tap(p.getByRole('button', { name: 'この花を選ぶ' })); await w(400);
  }
  await read('棚の札', '.shop-view__label');
  await tap(p.getByRole('button', { name: /束ねる/ })); await w(1000);
  await read('束ねる', '.arrange__styles, .arrange__style-note, .arrange__material-name');
  await tap(p.getByRole('button', { name: 'お渡しする' })); await w(1600);
  await read('お渡し', '.deliver__words, .deliver__note');
  const label = await p.locator('.deliver__foot .button').textContent();
  await tap(p.locator('.deliver__foot .button')); await w(1400);
  if (label.includes('片づける')) break;
}
await w(1600);
await read('余韻', '.after__farewell, .after__guests');
await tap(p.getByRole('button', { name: '今日のお店を閉める' })); await w(900);
await b.close();

const firstCard = cat['花の紙（はじめて）'] ?? 0;
delete cat['花の紙（はじめて）'];
const perDay = Object.values(cat).reduce((a, c) => a + c, 0);
const perGuest = perDay / guests;

console.log(`\n測った日  ${guests}組  ${taps}タップ  ${perDay}字`);
for (const [k, v] of Object.entries(cat).sort((a, b) => b[1] - a[1]))
  console.log(`  ${k.padEnd(20)} ${String(v).padStart(5)}字`);

const yearGuests = Array.from({ length: 20 }, (_, i) => visitsForDay(i + 1)).reduce((a, c) => a + c, 0);
const yearChars = Math.round(perGuest * yearGuests) + firstCard * 29;
const yearTaps = Math.round((taps / guests) * yearGuests);

console.log(`\n一年（20日・${yearGuests}組）`);
console.log(`  読む   ${yearChars.toLocaleString()}字（うち はじめて会う29種の紙 ${(firstCard * 29).toLocaleString()}字）`);
console.log(`  押す   ${yearTaps.toLocaleString()}回`);
console.log('\n  読む速さ    かかる時間');
for (const cps of [6, 8, 10]) {
  const sec = yearChars / cps + yearTaps * 1.2;
  console.log(`  ${cps}字/秒      ${Math.round(sec / 60)}分`);
}

/**
 * 画面を、決めた端末の大きさで撮る。
 *
 *   node tools/shot.mjs <出力先> [場面...] [--size 390x844] [--day 1]
 *
 * 場面は title / market / opening / greeting / shop / detail / arrange / deliver / after。
 *
 * ── なぜ大きさを変えられるようにしたか ────────────────────
 *
 * 430×932 でだけ確かめていたころ、実機で
 * 「コピーとカゴの持ち手が重なっている」と言われました。
 * こちらでは重なっていません。**画面の高さが違うと、重なります。**
 * 縦に積んだものと、下から置いたものは、高さで近づき方が変わるので。
 * だから狭い端末でも撮れるようにしてあります。
 */
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

import { chromium } from 'playwright';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const out = args[0];
const size = flag('size', '430x932');
const day = Number(flag('day', '1'));
const url = flag('url', 'http://localhost:4321/');
const scenes = args
  .slice(1)
  .filter((a) => !a.startsWith('--') && !/^\d+x\d+$/.test(a) && a !== String(day) && a !== url);

const [width, height] = size.split('x').map(Number);
const target = url.startsWith('http') ? url : pathToFileURL(resolve(url)).href;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});

const shot = async (name) => {
  const path = resolve(out, `${name}-${size}.png`);
  mkdirSync(dirname(path), { recursive: true });
  await page.screenshot({ path });
  console.log(`  ${path}`);
};

const wait = (ms) => page.waitForTimeout(ms);
const tap = async (name, options) => {
  await page.getByRole('button', { name }).first().click({ timeout: 8000, ...options });
};

await page.goto(target, { waitUntil: 'networkidle' });
await page.evaluate(
  (d) =>
    localStorage.setItem(
      'flower-shop-hanasaku:v1',
      JSON.stringify({ day: d, earnings: 0, library: {}, favorites: [], memories: [], soundOn: false }),
    ),
  day,
);
await page.reload({ waitUntil: 'networkidle' });
await wait(2400);

const want = new Set(scenes.length ? scenes : ['title']);
const seen = [];

if (want.has('title')) await shot('title');

if ([...want].some((s) => s !== 'title')) {
  await tap('扉を押す');
  await wait(2600);
  if (want.has('market')) await shot('market');

  await page.locator('.market__stall').nth(1).click({ force: true });
  await wait(1200);
  if (want.has('market-held')) await shot('market-held');

  await tap('この花を店頭に飾る');
  await wait(2000);
  if (want.has('opening')) await shot('opening');

  if (want.has('opening-detail')) {
    await page.locator('.morning__front').click();
    await wait(1200);
    await shot('opening-detail');
    await tap('閉じる');
    await wait(900);
  }

  await tap('お店を開く');
  await wait(2000);
  if (want.has('greeting')) await shot('greeting');

  await tap('わかりました');
  await wait(1400);
  if (want.has('shop')) await shot('shop');

  if (want.has('detail') || want.has('arrange') || want.has('deliver') || want.has('after')) {
    for (const i of [0, 2, 4]) {
      await page.locator('.shop-view .stand').nth(i).click({ force: true });
      await wait(800);
      if (i === 0 && want.has('detail')) await shot('detail');
      await tap('この花を選ぶ');
      await wait(600);
    }
    if (want.has('shop-picked')) await shot('shop-picked');
  }

  if (want.has('arrange') || want.has('deliver') || want.has('after')) {
    await tap(/束ねる/);
    await wait(1600);
    if (want.has('arrange')) await shot('arrange');
    for (const name of ['高さを出してすっきり', '自然に広がる']) {
      if (!want.has(`arrange-${name}`)) continue;
      await tap(name);
      await wait(900);
      await shot(`arrange-${name}`);
    }
  }

  if (want.has('deliver') || want.has('after')) {
    await tap('お渡しする');
    await wait(2400);
    if (want.has('deliver')) await shot('deliver');
  }

  if (want.has('after')) {
    // 最後の方まで、繰り返しお見送りする
    for (let guard = 0; guard < 8; guard += 1) {
      const last = await page.getByRole('button', { name: /お見送り/ }).first().textContent();
      await page.getByRole('button', { name: /お見送り/ }).first().click();
      await wait(1800);
      if (last?.includes('片づける')) break;
      // 次の方。手早く通す。
      await tap('わかりました');
      await wait(1200);
      for (const i of [0, 2]) {
        await page.locator('.shop-view .stand').nth(i).click({ force: true });
        await wait(700);
        await tap('この花を選ぶ');
        await wait(500);
      }
      await tap(/束ねる/);
      await wait(1400);
      await tap('お渡しする');
      await wait(2200);
      seen.push(guard);
    }
    await wait(1800);
    await shot('after');
  }
}

console.log(`  （お客さま ${seen.length + 1} 組）`);
await browser.close();

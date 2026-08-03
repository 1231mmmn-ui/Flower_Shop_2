/**
 * 一日を通しで遊び切れるかを、機械に確かめさせる。
 *
 * 人が遊べていないうちに「お渡しの画面から出られない」という詰みが出た。
 * 同じ種類の穴 ── **押せるはずのものが押せない** ── を探すための道具。
 *
 *   node tools/qa.mjs [ポート]
 *
 * 各手順に見出しを付けて、止まった場所がそのまま報告になるようにしてある。
 */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { chromium } from 'playwright';

/**
 * 相手はポート番号でも、URLでも、ファイルでもよい。
 *
 *   node tools/qa.mjs 4220                    ふだんの `vite preview`
 *   node tools/qa.mjs dist/flower-shop.html   一枚にまとめたほう
 *
 * 一枚のほうも同じ手順で通すこと。**束ね方を変えたら壊れる**ものが
 * あるかどうかは、遊んでみるまで分かりません。
 */
const ARG = process.argv[2] ?? '4220';
const URL = /^\d+$/.test(ARG)
  ? `http://localhost:${ARG}/`
  : ARG.startsWith('http')
    ? ARG
    : pathToFileURL(resolve(ARG)).href;

const fails = [];
let step = '';

async function must(page, name, fn) {
  step = name;
  try {
    await fn();
    return true;
  } catch (err) {
    const phase = await page
      .evaluate(() => document.querySelector('.stage')?.firstElementChild?.className ?? '(空)')
      .catch(() => '(取れず)');
    fails.push(`${name}  ── 画面: ${phase}`);
    console.log(`  ✗ ${name}   [${phase}]`);
    return false;
  }
}

/** 保存されている状態を作ってから開く。 */
async function open(page, saved) {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(
    (s) => localStorage.setItem('flower-shop-hanasaku:v1', JSON.stringify(s)),
    saved,
  );
  await page.reload({ waitUntil: 'networkidle' });
}

const base = (day) => ({
  day,
  earnings: 0,
  library: {},
  favorites: [],
  memories: [],
  soundOn: false,
});

/**
 * 一組ぶんの接客。挨拶 → 選ぶ → 束ねる → 渡す → お見送り。
 *
 * 返り値は「この方が最後だったか」。
 * 一日に3〜5組いらっしゃるので、呼ぶ側が繰り返します。
 */
async function serveOne(page, { picks = 3, touchBouquet = true, tag = '' } = {}) {
  await must(page, `${tag}① 挨拶：希望を受ける`, () =>
    page.getByRole('button', { name: 'わかりました' }).click({ timeout: 8000 }),
  );
  await page.waitForTimeout(900);

  for (let i = 0; i < picks; i += 1) {
    await must(page, `${tag}② 棚：${i + 1}本目を見る`, () =>
      page.locator('.shop-view .stand').nth(i * 2).click({ force: true, timeout: 8000 }),
    );
    await page.waitForTimeout(600);
    // **紙の下ではなく、名前の右**で選べること（実機の指摘で移した）。
    await must(page, `${tag}② 一輪：${i + 1}本目を取る`, () =>
      page.getByRole('button', { name: 'この花を選ぶ' }).click({ timeout: 8000 }),
    );
    await page.waitForTimeout(450);
  }

  await must(page, `${tag}③ 束ねるへ進む`, () =>
    page.getByRole('button', { name: /束ねる/ }).click({ timeout: 8000 }),
  );
  await page.waitForTimeout(1100);

  await must(page, `${tag}③-b 束ね方が三つある`, async () => {
    const n = await page.locator('.arrange__style').count();
    if (n !== 3) throw new Error(`束ね方が ${n} 個`);
  });

  await must(page, `${tag}③-c 束ね方を選び替えられる`, async () => {
    await page.getByRole('button', { name: '自然に広がる' }).click({ timeout: 8000 });
    await page.waitForTimeout(600);
    const chosen = await page.locator('.arrange__style.is-chosen').textContent();
    if (chosen !== '自然に広がる') throw new Error(`選ばれたのは ${chosen}`);
  });

  // 花を失っていないこと。**選び直しであって、組み直しではない。**
  await must(page, `${tag}③-d 形を変えても花は減らない`, async () => {
    const n = await page.locator('.bouquet__stem').count();
    if (n !== picks) throw new Error(`花が ${n} 本（取ったのは ${picks} 本）`);
  });

  await must(page, `${tag}④ お渡しする`, () =>
    page.getByRole('button', { name: 'お渡しする' }).click({ timeout: 8000 }),
  );
  await page.waitForTimeout(1600);

  if (touchBouquet) {
    await must(page, `${tag}⑤ 眺める間：束にふれて戻せる`, async () => {
      await page.locator('.deliver__moment').click({ force: true, timeout: 8000 });
      await page.waitForTimeout(700);
      await page.locator('.deliver__moment').click({ force: true, timeout: 8000 });
      await page.waitForTimeout(700);
      // 戻せていないと、ここから出られない（一度そうなっていた）。
      const foot = await page.locator('.deliver__foot .button').isEnabled();
      if (!foot) throw new Error('お見送りが押せない');
    });
  }

  const label = await page.locator('.deliver__foot .button').textContent();
  const last = label?.includes('片づける') ?? false;
  await must(page, `${tag}⑥ ${last ? '最後の方を' : ''}お見送りする`, () =>
    page.locator('.deliver__foot .button').click({ timeout: 8000 }),
  );
  await page.waitForTimeout(1500);
  return last;
}

/** 市場 → 今日の花 → 開店 → 3〜5組 → 閉店 → 翌日。 */
async function playDay(page, { picks = 3, touchBouquet = true } = {}) {
  await must(page, '扉を押す', () =>
    page.getByRole('button', { name: '扉を押す' }).click({ timeout: 8000 }),
  );
  await page.waitForTimeout(1400);

  await must(page, '⓪-a 市場：花を手に取る', () =>
    page.locator('.market__stall').nth(1).click({ force: true, timeout: 8000 }),
  );
  await page.waitForTimeout(700);
  await must(page, '⓪-a 市場：今日の花を決める', () =>
    page.getByRole('button', { name: 'この花を店頭に飾る' }).click({ timeout: 8000 }),
  );
  await page.waitForTimeout(1600);

  // ⓪-b 開店前は「今日の一輪だけ」。売り物の棚は出さない。
  await must(page, '⓪-b 開店前：今日の一輪が中央にある', async () => {
    const n = await page.locator('.morning__front').count();
    if (n !== 1) throw new Error(`中央の花が ${n} 個`);
    const shelf = await page.locator('.morning .stand').count();
    if (shelf !== 0) throw new Error(`売り物の棚が ${shelf} 台 出ている`);
  });

  await must(page, '⓪-b 開店前：中央の花と、開く紙が一致している', async () => {
    const name = (await page.locator('.morning__name').textContent()) ?? '';
    await page.locator('.morning__front').click({ timeout: 8000 });
    await page.waitForTimeout(900);
    const shown = await page.locator('.detail__name').textContent();
    if (!name.startsWith(shown ?? '@')) throw new Error(`札は ${name}、紙は ${shown}`);
    // 店頭の花は商品ではないので、値段は出さない。
    const price = await page.locator('.detail__price').count();
    if (price !== 0) throw new Error('店頭の花に値段が出ている');
    await page.getByRole('button', { name: '閉じる' }).click({ timeout: 8000 });
    await page.waitForTimeout(700);
  });

  await must(page, '⓪-b 開店前：お店を開く', () =>
    page.getByRole('button', { name: 'お店を開く' }).click({ timeout: 8000 }),
  );
  await page.waitForTimeout(1500);

  // 3〜5組。最後の方をお見送りするまで繰り返す。
  let guests = 0;
  for (let i = 0; i < 6; i += 1) {
    guests += 1;
    const last = await serveOne(page, {
      picks,
      touchBouquet: touchBouquet && i === 0,
      tag: `${i + 1}組目 `,
    });
    if (last) break;
  }
  await must(page, '来店は3〜5組', () => {
    if (guests < 3 || guests > 5) throw new Error(`${guests}組`);
  });
  console.log(`  （${guests}組）`);

  await page.waitForTimeout(1800);
  await must(page, '⑦ 余韻：今日いらした方の名前がある', async () => {
    const n = await page.locator('.after__guest').count();
    if (n !== guests) throw new Error(`名前が ${n} 人ぶん（来たのは ${guests}組）`);
  });

  await must(page, '⑦ 余韻：今日のお店を閉める', () =>
    page.getByRole('button', { name: '今日のお店を閉める' }).click({ timeout: 8000 }),
  );
  await page.waitForTimeout(1400);
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => fails.push(`画面のエラー: ${e.message}（${step}）`));
page.on('console', (m) => {
  if (m.type() === 'error') fails.push(`console.error: ${m.text()}（${step}）`);
});

// ── 1. ふつうの一日。束にふれて、戻せるか。
console.log('\n【1】1日目（束にふれる）');
await open(page, base(1));
await playDay(page, { picks: 3 });

// ── 2. 束にふれずに、そのまま進めるか。
console.log('\n【2】5日目（束にふれない）');
await open(page, base(5));
await playDay(page, { picks: 2, touchBouquet: false });

// ── 3. 花1本だけ（いちばん少ない束）
console.log('\n【3】花を1本だけで渡す（9日目）');
await open(page, base(9));
await playDay(page, { picks: 1 });

// ── 4. 花びらが残らない日（day % 3 === 0）
console.log('\n【4】花びらが残らない日（12日目）');
await open(page, base(12));
await playDay(page, { picks: 2 });

// ── 5. 季節がひと巡りする日 → エンディング
console.log('\n【5】20日目 → エンディング');
await open(page, { ...base(20), favorites: ['gerbera', 'rose'] });
await playDay(page, { picks: 2 });
await must(page, '⑧ エンディング：店を開ける', () =>
  page.getByRole('button', { name: '店を開ける' }).click({ timeout: 8000 }),
);
await page.waitForTimeout(1500);
// 市場が入ったので、新しい一日は**市場から**始まる（開店前ではない）。
// ここは実装が変わったぶん、期待のほうを直した。
await must(page, '⑨ 新しい一日が、市場から始まっている', async () => {
  const cls = await page.evaluate(
    () => document.querySelector('.stage')?.firstElementChild?.className ?? '',
  );
  if (!cls.includes('market')) throw new Error(cls);
});

// ── 6. アルバムを各画面から開いて、元の画面へ戻れるか
console.log('\n【6】アルバムの出入り');
await open(page, { ...base(3), library: { rose: { flowerId: 'rose', delivered: 1, metOnDay: 1 } } });
await page.getByRole('button', { name: '店のアルバム' }).click();
await page.waitForTimeout(900);
await must(page, 'タイトル → アルバム → 閉じる', async () => {
  await page.getByRole('button', { name: '← 閉じる' }).click({ timeout: 8000 });
  await page.waitForTimeout(700);
  const cls = await page.evaluate(
    () => document.querySelector('.stage')?.firstElementChild?.className ?? '',
  );
  if (!cls.includes('title')) throw new Error(`戻り先が違う: ${cls}`);
});

await page.getByRole('button', { name: '扉を押す' }).click();
await page.waitForTimeout(1600);
await page.locator('.market__stall').nth(0).click({ force: true });
await page.waitForTimeout(600);
await page.getByRole('button', { name: 'この花を店頭に飾る' }).click();
await page.waitForTimeout(1800);
await must(page, '開店前 → アルバム → 閉じる → 開店前', async () => {
  await page.getByRole('button', { name: 'アルバム' }).click({ timeout: 8000 });
  await page.waitForTimeout(900);
  await page.getByRole('button', { name: '← 閉じる' }).click({ timeout: 8000 });
  await page.waitForTimeout(800);
  const cls = await page.evaluate(
    () => document.querySelector('.stage')?.firstElementChild?.className ?? '',
  );
  if (!cls.includes('morning')) throw new Error(`戻り先が違う: ${cls}`);
});

// ── 7. 束ねる画面から棚へ戻れるか
console.log('\n【7】束ねる画面から棚へ戻る');
await open(page, base(2));
await page.getByRole('button', { name: '扉を押す' }).click();
await page.waitForTimeout(1600);
await page.locator('.market__stall').nth(0).click({ force: true });
await page.waitForTimeout(600);
await page.getByRole('button', { name: 'この花を店頭に飾る' }).click();
await page.waitForTimeout(1800);
await page.getByRole('button', { name: 'お店を開く' }).click();
await page.waitForTimeout(1500);
await page.getByRole('button', { name: 'わかりました' }).click();
await page.waitForTimeout(900);
for (const i of [0, 2]) {
  await page.locator('.shop-view .stand').nth(i).click({ force: true });
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'この花を選ぶ' }).click();
  await page.waitForTimeout(500);
}
await page.getByRole('button', { name: /束ねる/ }).click();
await page.waitForTimeout(1200);
await must(page, '束ねる画面から棚へ戻れる', async () => {
  const back = page.getByRole('button', { name: '花を選ぶ' }).first();
  if ((await back.count()) === 0) throw new Error('戻る手だてが見つからない');
  await back.click({ timeout: 8000 });
  await page.waitForTimeout(900);
  const cls = await page.evaluate(
    () => document.querySelector('.stage')?.firstElementChild?.className ?? '',
  );
  if (!cls.includes('shop-view')) throw new Error(`戻り先が違う: ${cls}`);
});

await browser.close();

console.log('\n────────────────────────────');
if (fails.length === 0) {
  console.log('通しで遊べました。詰まるところはありません。');
} else {
  console.log(`止まった／おかしかったところ：${fails.length}件`);
  for (const f of fails) console.log(`  ・${f}`);
}
process.exit(fails.length === 0 ? 0 : 1);

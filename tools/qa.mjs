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
import { chromium } from 'playwright';

const PORT = process.argv[2] ?? '4220';
const URL = `http://localhost:${PORT}/`;

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

/** 開店前 → 挨拶 → 選ぶ → 束ねる → 渡す → 余韻 → 翌日。 */
async function playDay(page, { picks = 3, touchBouquet = true } = {}) {
  await must(page, '扉を押す', () =>
    page.getByRole('button', { name: '扉を押す' }).click({ timeout: 8000 }),
  );
  await page.waitForTimeout(1400);

  await must(page, '⓪-a 市場：花を手に取る', () =>
    page.locator('.market__stall').nth(1).click({ force: true, timeout: 8000 }),
  );
  await page.waitForTimeout(700);
  await must(page, '⓪-a 市場：入口の花を決める', () =>
    page.getByRole('button', { name: 'この花を連れて帰る' }).click({ timeout: 8000 }),
  );
  await page.waitForTimeout(1800);

  await must(page, '入口の一輪挿しが出ている', async () => {
    const n = await page.locator('.front-vase').count();
    if (n !== 1) throw new Error(`front-vase が ${n} 個`);
  });

  await must(page, '⓪-b 開店前：札を裏返す', () =>
    page.getByRole('button', { name: 'お店を開ける' }).click({ timeout: 8000 }),
  );
  await page.waitForTimeout(1500);

  await must(page, '① 挨拶：希望を受ける', () =>
    page.getByRole('button', { name: 'わかりました' }).click({ timeout: 8000 }),
  );
  await page.waitForTimeout(1000);

  for (let i = 0; i < picks; i += 1) {
    await must(page, `② 棚：${i + 1}本目を見る`, () =>
      page.locator('.shop-view .stand').nth(i * 2).click({ force: true, timeout: 8000 }),
    );
    await page.waitForTimeout(600);
    await must(page, `② 一輪：${i + 1}本目を取る`, () =>
      page.getByRole('button', { name: /この花を取る/ }).click({ timeout: 8000 }),
    );
    await page.waitForTimeout(500);
  }

  await must(page, '③ 束ねるへ進む', () =>
    page.getByRole('button', { name: /束ねる/ }).click({ timeout: 8000 }),
  );
  await page.waitForTimeout(1200);

  await must(page, '③-b 束ねる：花が一本ずつつかめる', async () => {
    const n = await page.locator('.bouquet__grab').count();
    if (n !== picks) throw new Error(`つかむところが ${n} 個（花は ${picks} 本）`);
  });

  await must(page, '④ お渡しする', () =>
    page.getByRole('button', { name: 'お渡しする' }).click({ timeout: 8000 }),
  );
  // 自動版はここで3秒後にUIが消える。消えたあとに触れるかを見る。
  await page.waitForTimeout(4200);

  if (touchBouquet) {
    await must(page, '⑤ 眺める間：束にふれて戻せる', () =>
      page.locator('.deliver__moment').click({ force: true, timeout: 8000 }),
    );
    await page.waitForTimeout(1300);
  }

  await must(page, '⑥ お見送りする', () =>
    page.getByRole('button', { name: 'お見送りする' }).click({ timeout: 8000 }),
  );
  await page.waitForTimeout(3400);

  await must(page, '⑦ 余韻：札を裏返して閉める', () =>
    page.getByRole('button', { name: 'お店を閉める' }).click({ timeout: 8000 }),
  );
  await page.waitForTimeout(1400);
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => fails.push(`画面のエラー: ${e.message}（${step}）`));
page.on('console', (m) => {
  if (m.type() === 'error') fails.push(`console.error: ${m.text()}（${step}）`);
});

// ── 1. 自動版の日（1〜4日目）。詰みが出ていたのはここ。
console.log('\n【1】自動版の日（1日目）');
await open(page, base(1));
await playDay(page, { picks: 3 });

// ── 2. 手動版の日（5〜8日目）。束にふれずに進めるか。
console.log('\n【2】手動版の日（5日目）・束にふれずに進む');
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
await page.getByRole('button', { name: 'この花を連れて帰る' }).click();
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

// ── 7. 束ねる画面での取り消し・やり直し
console.log('\n【7】束ねる画面の取り消し');
await open(page, base(2));
await page.getByRole('button', { name: '扉を押す' }).click();
await page.waitForTimeout(1600);
await page.locator('.market__stall').nth(0).click({ force: true });
await page.waitForTimeout(600);
await page.getByRole('button', { name: 'この花を連れて帰る' }).click();
await page.waitForTimeout(1800);
await page.getByRole('button', { name: 'お店を開ける' }).click();
await page.waitForTimeout(1500);
await page.getByRole('button', { name: 'わかりました' }).click();
await page.waitForTimeout(900);
for (const i of [0, 2]) {
  await page.locator('.shop-view .stand').nth(i).click({ force: true });
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: /この花を取る/ }).click();
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

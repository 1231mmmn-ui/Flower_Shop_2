import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport:{width:430,height:932}, deviceScaleFactor:2 });
let bytes = 0, files = 0;
const perScreen = [];
p.on('response', async (r) => {
  const u = r.url();
  if (!/\.(png|jpg|css|js)$/.test(u)) return;
  try { const buf = await r.body(); bytes += buf.length; files += 1; } catch {}
});
const mark = (name) => { perScreen.push([name, files, +(bytes/1048576).toFixed(2)]); };

await p.goto('http://localhost:4231/', { waitUntil:'networkidle' });
mark('タイトル');
await p.evaluate(() => localStorage.setItem('flower-shop-hanasaku:v1', JSON.stringify({
  day:2, earnings:0, library:{}, favorites:[], memories:[], soundOn:false })));
await p.reload({ waitUntil:'networkidle' });
bytes = 0; files = 0;
mark('タイトル（読み直し）');

await p.getByRole('button', { name:'扉を押す' }).click();
await p.waitForTimeout(2500); mark('⓪-b 開店前');
await p.getByRole('button', { name:'お店を開ける' }).click();
await p.waitForTimeout(2000); mark('① 挨拶');
await p.getByRole('button', { name:'わかりました' }).click();
await p.waitForTimeout(3000); mark('② 棚（花29種）');

console.log('画面ごとの累計（そこまでに読み込んだ量）');
for (const [n, f, mb] of perScreen) console.log(`  ${n.padEnd(20,'　')} ${String(f).padStart(3)}件  ${mb} MB`);

// 棚が実際に何を読んでいるか
console.log('\n棚の花：表示の大きさと、読み込んだ画像の大きさ');
console.log(JSON.stringify(await p.evaluate(() => {
  const imgs = [...document.querySelectorAll('.shop-view__counter .stand img')];
  const one = imgs[0];
  return {
    棚に出ている花: imgs.length,
    画面での表示幅: Math.round(one.getBoundingClientRect().width),
    画像そのものの幅: one.naturalWidth,
    倍率のむだ: +(one.naturalWidth / one.getBoundingClientRect().width).toFixed(1),
    lazyのもの: imgs.filter(i => i.loading === 'lazy').length,
  };
}), null, 1));
await b.close();

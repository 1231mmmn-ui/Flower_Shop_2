import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await p.evaluate(()=>localStorage.setItem('flower-shop-hanasaku:v1',JSON.stringify({day:1,earnings:0,library:{},favorites:[],memories:[],hintsDone:['inspect'],soundOn:false})));
await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(1400);
await p.getByRole('button',{name:'扉を押す'}).click(); await p.waitForTimeout(1600);
await p.locator('.market__stall').nth(1).click({force:true}); await p.waitForTimeout(500);
await p.getByRole('button',{name:'この花を店頭に飾る'}).click(); await p.waitForTimeout(1400);
await p.getByRole('button',{name:'お店を開く'}).click(); await p.waitForTimeout(1400);
await p.getByRole('button',{name:'わかりました'}).click(); await p.waitForTimeout(800);
for (const k of [0,2,4]) { await p.locator('.shop-view .stand').nth(k).click({force:true}); await p.waitForTimeout(500); await p.getByRole('button',{name:'この花を選ぶ'}).click(); await p.waitForTimeout(400); }
await p.getByRole('button',{name:/束ねる/}).click(); await p.waitForTimeout(1000);
await p.getByRole('button',{name:'お渡しする'}).click(); await p.waitForTimeout(2600);

// 花の「描かれている」上端は、要素の矩形では分かりません（絵の上は透明）。
// 束を消した画面と撮り比べて、変わった画素のいちばん上を探します。
await p.screenshot({ path: '/tmp/fit-with.png', clip: await p.locator('.deliver__moment').boundingBox() });
const box = await p.locator('.deliver__moment').boundingBox();
await p.evaluate(() => { document.querySelector('.deliver__bouquet').style.visibility = 'hidden'; });
await p.waitForTimeout(300);
await p.screenshot({ path: '/tmp/fit-without.png', clip: box });
await p.evaluate(() => { document.querySelector('.deliver__bouquet').style.visibility = ''; });
await p.waitForTimeout(300);

const r = await p.evaluate(() => {
  const g = s => document.querySelector(s).getBoundingClientRect();
  const m = g('.deliver__moment'), f = g('.deliver__figure');
  // 花の実際の広がり（絵の透明部分は無視できないが、要素の矩形で近似）
  let top = Infinity, left = Infinity, right = -Infinity;
  document.querySelectorAll('.bouquet__stem').forEach(el => {
    const r = el.getBoundingClientRect();
    top = Math.min(top, r.top); left = Math.min(left, r.left); right = Math.max(right, r.right);
  });
  // 人物の絵は 800x800。顔の中心 0.42、あご 0.58、頭のてっぺん 0.20
  return {
    枠: [Math.round(m.top), Math.round(m.bottom)],
    頭のてっぺん: Math.round(f.top + f.height * 0.20),
    顔の中心: Math.round(f.top + f.height * 0.42),
    あご: Math.round(f.top + f.height * 0.58),
  };
});
console.log(JSON.stringify(r));
await b.close();

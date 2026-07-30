# Flower Shop ～花咲く時間～

小さな街の、木造のお花屋さん。  
お客様の想いに寄り添って、世界に一つだけのブーケを束ねるゲームです。

高得点を取るゲームでも、お金を稼ぐゲームでもありません。  
**誰かを想いながら花を選ぶ時間**を楽しむための、静かなゲームです。

---

## 遊び方

```
お客様が来店する → 想いを聞く → 花瓶から花を選ぶ → 束ねて包む
   → お渡しして言葉を受け取る → 次のお客様へ
```

- 21種の切り花が、季節をまたいで並びます。花をタップすると、その花だけが前に出ます。
  名前・花言葉・価格・旬・おすすめ用途・ブーケとの相性を、ゆっくり眺められます。
- 束ねる画面では、花を指でつまんで好きな向きに動かせます。包み紙とリボンも選べます。
- お客様は、どんな束でも必ず笑顔で受け取ってくれます。返ってくるのは前向きな助言だけです。
- 出会った花は図鑑に残ります。

**入れていないもの**：ガチャ／ランキング／PvP／時間制限／焦らせる演出／広告／
派手なエフェクト／赤文字の警告／失敗して怒るお客様。

---

## 動かす

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/ に書き出し
npm run typecheck
```

### スマートフォンで触る

このお店は **430×932** の縦画面で作っています。
**パソコンよりも、スマートフォンで持ったときが本番**です。

同じ Wi-Fi にいれば、`npm run dev` のまま電話から開けます
（`server.host` を有効にしてあります）。
起動時に出る `Network:` の URL を、電話のブラウザに入れてください。

置いたまま遊べるようにするなら、`.github/workflows/pages.yml` があります。
**最初の一度だけ** Settings → Pages → Source を「GitHub Actions」にすれば、
以降は push するたびに更新されます。

画像素材を作り直すとき：

```bash
pip install Pillow
npm run assets                                                # すべて（約80秒）
python3 tools/generate_placeholder_assets.py --only flowers   # 花だけ
# 対象: flowers / scenes / customers / props / wrap / greenhouse
```

---

## 画像素材について

**`IMAGE_ASSETS.md` が画像素材の正式な仕様書です。**  
サイズ・透過・保存場所・ファイル名・命名規則は、この仕様書のまま実装しています。

`public/assets/` に入っている画像は、その仕様を満たす**プレースホルダ**です
（`tools/placeholder_art/` の水彩タッチの筆で生成しています）。  
完成画（半写実・水彩）に差し替えるときは、**同じファイル名・同じサイズ・同じ透過**で
上書きするだけで、コードの変更は要りません。

参照パスを組み立てるのは `src/assets/paths.ts` だけです。画面側でパスを直書きしません。

### コード側での組み立て方

仕様書が「1本の花を扇状に合成する現行方式」を薦めているので、そのまま踏襲しています。

| 見た目 | 素材 | 組み立て方 |
|---|---|---|
| 店頭の花瓶 | `props/vase.png` ＋ `flowers/<id>.png` | 花瓶の水面に切り口が沈むよう重ねる（3本） |
| ブーケ | `flowers/<id>.png` ×N | 画像の**下端中央＝切り口**を軸に、扇状へ回す |
| 包み紙・リボン | （画像なし） | 資材の色を借りて CSS で描く。`assets/wrap/` の画像は資材を選ぶ画面で使う |
| 店内 | `scenes/shop-<season>.jpg` | 上に置き、下端を壁の色へ溶かす。手前に `props/counter.jpg` を敷く |
| 図鑑・かご | `flowers/<id>.png` | 花の頭のあたりだけを切り出して見せる |

`scenes/shop-<season>.jpg` は、共通の店内へ `scenes/window-<season>.png` を
はめ込んで書き出しています（仕様書が薦める「窓だけ差し替える」やり方を、
実行時ではなく画像を作る段階でやっています）。窓の位置は
`tools/placeholder_art/scene.py` の `WINDOW_BOX` にあります。

---

## 組み立て

```
IMAGE_ASSETS.md            画像素材の正式仕様書（唯一の正）
tools/
  generate_placeholder_assets.py   仕様通りにプレースホルダ画像を書き出す
  placeholder_art/
    paint.py               水彩の筆（にじみ・花びら・茎・葉・影）。光源は左上で統一
    flowers.py             21種の切り花
    scene.py               窓の景色（四季）と店内
    props.py               花瓶・カゴ・カウンター・ラッピング資材・お客さま・温室
public/assets/
  flowers/    21枚          scenes/  窓4枚 + 店内5枚
  customers/  8人×2表情      props/   花瓶・カゴ・カウンター・カード
  wrap/       紙6 + リボン5   greenhouse/ 4段階
src/
  design/tokens.ts         デザイン定数。色・角丸・余白・文字・影・時間はここだけ
  assets/paths.ts          画像パスの組み立て（直書き禁止）
  data/                    花・お客さま・ラッピング・季節
  game/
    types.ts               状態の形
    arrange.ts             花の束ね方（葉ものは外、主役は中心と手前）
    evaluation.ts          お客様の受け取り方（採点ではない）
    GameContext.tsx        状態と、その変え方
  components/              Scene / FlowerVase / FlowerDetail / Bouquet / BouquetWrap …
  screens/                 Title / Greeting / Shop / Arrange / Deliver / Library
  audio/ambience.ts        店の音（音源ファイルを持たず Web Audio で鳴らす）
  styles/global.css        下地。値は書かず --fs-* 変数だけを使う
```

### 決めごと

- **デザイン定数は `src/design/tokens.ts` にだけ書く。** 起動時に `--fs-*` という
  CSS 変数として流し込まれます。CSS に色や px を直接書きません。
- **光源は左上、影は右下。** 画像もCSSの影も、この一つの約束に揃えています。
- **彩度の高い色は花だけ。** UI はベージュ・アイボリー・木・セージ・くすみ色で組みます。
- **UI は主役ではありません。** 半透明・角丸・広い余白で、花を邪魔しないようにしています。
- **動きはゆっくり。** 花を選ぶと 0.2 秒ほどで少し浮き上がり、影が濃くなる程度です。
- お客様のセリフに、冷たい言い方は書きません。評価画面に責める言葉は出しません。

### 花を増やすとき

仕様書の「`FLOWERS` 配列に1行足せば全画面へ自動反映」と同じ仕組みです。

1. `src/data/flowers.ts` の `FLOWERS` に 1 件足す（`id` は英小文字のスラッグ）。
   → 画像は `assets/flowers/<id>.png` が `id` から自動で引かれ、
     店頭・詳細・ブーケ・図鑑のすべてに出ます。
2. `IMAGE_ASSETS.md` §1 の一覧にも和名とプロンプトを足す。
3. 完成画がまだなら、`tools/placeholder_art/flowers.py` の `RECIPES` に
   同じ `id` で描き方を足し、`npm run assets -- --only flowers` で書き出す。

お客さま（`src/data/customers.ts`）とラッピング（`src/data/wrapping.ts`）も同じで、
`id` を仕様書の一覧に合わせておけば、画像は自動で引かれます。

---

## 進捗の保存

図鑑・日数・これまでの束は `localStorage`（キー `flower-shop-hanasaku:v1`）に保存されます。
サーバーには何も送りません。

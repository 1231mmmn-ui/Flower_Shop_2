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

- 花をタップすると、その花だけが前に出ます。名前・花言葉・価格・旬・おすすめ用途・
  ブーケとの相性を、ゆっくり眺められます。
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

画像素材を作り直すとき：

```bash
pip install Pillow
npm run assets                                                # すべて
python3 tools/generate_placeholder_assets.py --only flowers   # 花だけ
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

ブーケ合成のために、素材には基準点の約束があります（詳細は `IMAGE_ASSETS.md`）。

| 素材 | 基準点 |
|---|---|
| `flower_<id>_stem.png` | 下端中央＝切り口 / 花の中心＝(450, 340) |
| `wrap_<id>.png` | 画像の下から 10% の高さ＝結び目 |
| `ribbon_<id>.png` | 画像の中心＝結び目 |

---

## 組み立て

```
IMAGE_ASSETS.md            画像素材の正式仕様書（唯一の正）
tools/
  generate_placeholder_assets.py   仕様通りにプレースホルダ画像を書き出す
  placeholder_art/
    paint.py               水彩の筆（にじみ・花びら・茎・葉・影）。光源は左上で統一
    flowers.py             12種の切り花・花瓶・サムネイル
    scene.py               店内（四季）と作業台
    props.py               ラッピング・リボン・お客様・UIテクスチャ
public/assets/             上の仕様に従った画像一式
src/
  design/tokens.ts         デザイン定数。色・角丸・余白・文字・影・時間はここだけ
  assets/paths.ts          画像パスの組み立て（直書き禁止）
  data/                    花・お客様・ラッピング・季節
  game/
    types.ts               状態の形
    arrange.ts             花の束ね方（葉ものは外、主役は中心と手前）
    evaluation.ts          お客様の受け取り方（採点ではない）
    GameContext.tsx        状態と、その変え方
  components/              Scene / FlowerVase / FlowerDetail / Bouquet / CustomerFigure …
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

1. `src/data/flowers.ts` に 1 件足す（`id` は英小文字のスラッグ）。
2. `IMAGE_ASSETS.md` §2 の一覧に和名を足す。
3. `tools/placeholder_art/flowers.py` の `RECIPES` に同じ `id` で描き方を足す。
4. `npm run assets -- --only flowers` で画像を書き出す。

画面側の変更は要りません。お客様・ラッピング・リボンも同じ手順です。

---

## 進捗の保存

図鑑・日数・これまでの束は `localStorage`（キー `flower-shop-hanasaku:v1`）に保存されます。
サーバーには何も送りません。

/**
 * 画像素材のパスはここでだけ組み立てる。
 * 置き場所・ファイル名・命名規則は IMAGE_ASSETS.md の通り。
 * 画面側でパスを直書きしないこと。差し替えはファイルを上書きするだけで済む。
 */

import type { SeasonId } from '../data/seasons';

const BASE = `${import.meta.env.BASE_URL}assets`;

/**
 * 絵の在り処を、一段はさんで引く。
 *
 * ふだんは `assets/flowers/rose.png` のような、ただのパスを返します。
 * ただし **一枚だけのHTML**（tools/build_single_file.py）に詰めたときは、
 * 絵がファイルではなく `window.__FS_ASSETS` の中に文字列として入っています。
 * そのときだけ、ここが差し替え先を返します。
 *
 * 画面側は何も変わりません。パスを組み立てる場所がここ一箇所だからこそ、
 * 「ファイルが無い場所でも動く」を、たった3行で足せました。
 */
type AssetMap = Record<string, string>;
const INLINE: AssetMap | undefined = (globalThis as { __FS_ASSETS?: AssetMap }).__FS_ASSETS;
const asset = (path: string) => INLINE?.[path] ?? `${BASE}/${path}`;

/** お客さまの表情差分（IMAGE_ASSETS.md §4） */
export type CustomerMood = 'normal' | 'happy';

/** 茎付きの1本の花（1024x1024・透過・下端近くまで茎）— §1 */
export const flower = (id: string) => asset(`flowers/${id}.png`);

/**
 * 同じ花の、小さいほう（512x512）— §1
 *
 * **別の絵ではありません。** 同じ絵の、置き場所に合った大きさです。
 *
 * どちらを使うか
 *   一輪の画面・ブーケ   `flower()`       894px 要るので 1024 が要る
 *   棚・アルバム         `flowerSmall()`  448px / 236px なので 512 で足りる
 *
 * 棚とアルバムで 1024 を読んでいたころは、扉を押した直後に 6.96MB を
 * 読み込んでいました。開店前の30秒が、待ち時間から始まってしまいます。
 * 見た目は変わりません（端末の実ピクセルより大きいまま）。
 */
export const flowerSmall = (id: string) => asset(`flowers/small/${id}.png`);

/**
 * ブーケの中で複数本描くとき用の、同じ花の別角度・別姿勢の絵。
 *
 * `variant` は 0 が基準（`flower(id)` と同じ絵）、1以上は
 * `flowers/variants/<id>-<n>.png`。何本まで用意してあるかは
 * `src/data/flowers.ts` の `FLOWER_VARIANT_COUNT` を見る
 * （載っていない花は 1 のまま＝基準の絵しか無い）。
 *
 * 同じ花を3本束ねても同じ1枚のコピーに見えていた問題への対応。
 * 花・葉・茎の輪郭が違う絵を混ぜることで、CSSでの回転・拡大縮小
 * だけでは出せない「一本ずつ違う」実感を作る。
 */
export const flowerVariant = (id: string, variant: number) =>
  variant <= 0 ? flower(id) : asset(`flowers/variants/${id}-${variant}.png`);

/** 店内背景（1600x1200・季節ごと）— §3 */
export const shopScene = (season: SeasonId) => asset(`scenes/shop-${season}.jpg`);

/**
 * ⓪-a 市場（1600x1200・季節ごと）— §3
 *
 * **店内ではありません。外です。**
 * 市場を店内の絵の上に置いたら、ただの「店の中の別画面」に見えました。
 * 窓の外の景色を、まわりに広げただけの場所として別に持ちます。
 */
export const marketScene = (season: SeasonId) => asset(`scenes/market-${season}.jpg`);

/** タイトル用の店内（下中央を空けた構図）— §3 */
export const titleScene = () => asset(`scenes/shop-title.jpg`);

/** 窓の景色だけの差し替え用（800x600・透過）— §3 */
export const windowView = (season: SeasonId) => asset(`scenes/window-${season}.png`);

/** お客さま（800x800・透過・バストアップ）— §4 */
export const customer = (id: string, mood: CustomerMood = 'normal') =>
  asset(`customers/${id}-${mood}.png`);

/**
 * その人の、前腕と手だけ（800x800・透過）— §4（追記）
 *
 * **人物と同じ枠です。** 同じ位置に重ねるだけで合います。
 * お渡しの画面で
 *
 *   人物 → ブーケ → 腕
 *
 * の順に重ねると、束が腕の内側に入って「抱えている」姿になります。
 * 一枚の絵では、この順番が作れません。
 */
export const customerArms = (id: string) => asset(`customers/${id}-arms.png`);

/** 小物（512x512・透過）— §5 */
export const basket = () => asset(`props/basket.png`);
export const basketFull = () => asset(`props/basket-full.png`);
export const cardBlank = () => asset(`props/card-blank.png`);

/** カウンターの木目テクスチャ（タイル可）— §5 */
export const counterTexture = () => asset(`props/counter.jpg`);

/** ラッピング資材（512x512・透過）— §6。id は paper-* / ribbon-* をそのまま渡す。 */
export const wrapMaterial = (id: string) => asset(`wrap/${id}.png`);

/**
 * 包んだ姿 — §6（追記）
 *
 * ブーケを包んだ紙と、結んだリボン。
 * **これまで CSS の多角形で描いていました。** 真っ直ぐな辺と、
 * 等間隔の折り目（conic-gradient）で、花と店内が水彩なのに
 * ここだけ図形に見えていたので、同じ筆で描いた絵に差し替えました。
 *
 * ── 紙は、背面と前面の2枚に分けました（2026-08-13）───────────
 *
 * 1枚の絵を CSS の mask/clip で使い回していたころは、クラフト紙
 * だけがリボンまで描き込まれた特別な絵で、他5色は折り目のない
 * 平たい図形のままだった。6色とも「背面（花の後ろに立つ、控えめな
 * 一枚）」「前面（折り返しと結び目まわりを持つ、いちばん見える
 * 一枚）」の同じ構造・同じ水彩の密度で描き直し、リボンは常に
 * `ribbonBow` 側の別資材で色を選べるようにした。
 */
export const wrapPaperBack = (paperId: string) => asset(`wrap/paper-back-${paperId}.png`);
export const wrapPaperFront = (paperId: string) => asset(`wrap/paper-front-${paperId}.png`);
export const ribbonBow = (ribbonId: string) => asset(`wrap/bow-${ribbonId}.png`);

/** 温室の生育段階（512x512・透過）— §7 */
export const greenhouseStage = (stage: 0 | 1 | 2 | 3) =>
  asset(`greenhouse/stage-${stage}.png`);

/**
 * 素材の規定サイズ。合成時の基準の計算に使う。
 *
 * 花は正方形で「下端中央＝茎の切り口」。ブーケはこの点を軸に扇状へ回す。
 * 花の中心のおおよその高さ（headY）は、店頭で花瓶に生けるときの沈め具合に使う。
 */
export const assetSize = {
  flower: { w: 1024, h: 1024, headY: 0.30 },
  scene: { w: 1600, h: 1200 },
  windowView: { w: 800, h: 600 },
  customer: { w: 800, h: 800 },
  prop: { w: 512, h: 512 },
  card: { w: 512, h: 384 },
} as const;

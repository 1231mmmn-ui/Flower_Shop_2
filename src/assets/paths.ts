/**
 * 画像素材のパスはここでだけ組み立てる。
 * 置き場所・ファイル名・命名規則は IMAGE_ASSETS.md の通り。
 * 画面側でパスを直書きしないこと。差し替えはファイルを上書きするだけで済む。
 */

import type { SeasonId } from '../data/seasons';

const BASE = `${import.meta.env.BASE_URL}assets`;

/** お客さまの表情差分（IMAGE_ASSETS.md §4） */
export type CustomerMood = 'normal' | 'happy';

/** 茎付きの1本の花（1024x1024・透過・下端近くまで茎）— §1 */
export const flower = (id: string) => `${BASE}/flowers/${id}.png`;

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
export const flowerSmall = (id: string) => `${BASE}/flowers/small/${id}.png`;

/** 店内背景（1600x1200・季節ごと）— §3 */
export const shopScene = (season: SeasonId) => `${BASE}/scenes/shop-${season}.jpg`;

/**
 * ⓪-a 市場（1600x1200・季節ごと）— §3
 *
 * **店内ではありません。外です。**
 * 市場を店内の絵の上に置いたら、ただの「店の中の別画面」に見えました。
 * 窓の外の景色を、まわりに広げただけの場所として別に持ちます。
 */
export const marketScene = (season: SeasonId) => `${BASE}/scenes/market-${season}.jpg`;

/** タイトル用の店内（下中央を空けた構図）— §3 */
export const titleScene = () => `${BASE}/scenes/shop-title.jpg`;

/** 窓の景色だけの差し替え用（800x600・透過）— §3 */
export const windowView = (season: SeasonId) => `${BASE}/scenes/window-${season}.png`;

/** お客さま（800x800・透過・バストアップ）— §4 */
export const customer = (id: string, mood: CustomerMood = 'normal') =>
  `${BASE}/customers/${id}-${mood}.png`;

/** 小物（512x512・透過）— §5 */
export const vase = () => `${BASE}/props/vase.png`;
export const basket = () => `${BASE}/props/basket.png`;
export const basketFull = () => `${BASE}/props/basket-full.png`;
export const cardBlank = () => `${BASE}/props/card-blank.png`;

/** カウンターの木目テクスチャ（タイル可）— §5 */
export const counterTexture = () => `${BASE}/props/counter.jpg`;

/** ラッピング資材（512x512・透過）— §6。id は paper-* / ribbon-* をそのまま渡す。 */
export const wrapMaterial = (id: string) => `${BASE}/wrap/${id}.png`;

/**
 * 包んだ姿 — §6（追記）
 *
 * ブーケを包んだ紙と、結んだリボン。
 * **これまで CSS の多角形で描いていました。** 真っ直ぐな辺と、
 * 等間隔の折り目（conic-gradient）で、花と店内が水彩なのに
 * ここだけ図形に見えていたので、同じ筆で描いた絵に差し替えました。
 */
export const wrapCone = (paperId: string) => `${BASE}/wrap/cone-${paperId}.png`;
export const ribbonBow = (ribbonId: string) => `${BASE}/wrap/bow-${ribbonId}.png`;

/** 温室の生育段階（512x512・透過）— §7 */
export const greenhouseStage = (stage: 0 | 1 | 2 | 3) =>
  `${BASE}/greenhouse/stage-${stage}.png`;

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

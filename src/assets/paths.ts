/**
 * 画像素材のパスはここでだけ組み立てる（IMAGE_ASSETS.md §1）。
 * 画面側でパスを直書きしないこと。差し替えはファイルを上書きするだけで済む。
 */

import type { SeasonId } from '../data/seasons';

const BASE = `${import.meta.env.BASE_URL}assets`;

export type CustomerMood = 'normal' | 'smile';

/** 切り花1本（900x1400・花の中心 450,340） */
export const flowerStem = (id: string) => `${BASE}/flowers/flower_${id}_stem.png`;

/** ガラスの花瓶に生けた状態（900x1100） */
export const flowerVase = (id: string) => `${BASE}/flowers/flower_${id}_vase.png`;

/** 図鑑・カード用（300x300） */
export const flowerThumb = (id: string) => `${BASE}/flowers/flower_${id}_thumb.png`;

/** 店内背景（2048x1152） */
export const shopScene = (season: SeasonId) => `${BASE}/scene/scene_shop_${season}.png`;

/** 手前の作業台（2048x640・透過） */
export const counter = () => `${BASE}/scene/scene_counter.png`;

/** ラッピングペーパー（1200x1200） */
export const wrapping = (id: string) => `${BASE}/wrapping/wrap_${id}.png`;

/** リボン（800x500・結び目の中心 400,250） */
export const ribbon = (id: string) => `${BASE}/ribbon/ribbon_${id}.png`;

/** お客様（900x1200・顔の中心 450,430） */
export const customer = (id: string, mood: CustomerMood = 'normal') =>
  `${BASE}/customers/customer_${id}_${mood}.png`;

export const uiPaper = () => `${BASE}/ui/ui_paper.png`;
export const uiWoodSign = () => `${BASE}/ui/ui_wood_sign.png`;
export const uiChalkBoard = () => `${BASE}/ui/ui_chalk_board.png`;

/**
 * 素材の規定サイズ。合成時の基準点計算に使う（IMAGE_ASSETS.md §3, §6, §7）。
 */
export const assetSize = {
  stem: { w: 900, h: 1400, headX: 450, headY: 340 },
  vase: { w: 900, h: 1100 },
  thumb: { w: 300, h: 300 },
  wrapping: { w: 1200, h: 1200 },
  ribbon: { w: 800, h: 500, knotX: 400, knotY: 250 },
  customer: { w: 900, h: 1200, faceX: 450, faceY: 430 },
} as const;

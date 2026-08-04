/**
 * お渡ししたブーケを、お客様がどう受け取ったか。
 *
 * ここは「採点」ではなく「受け取り方」を決める場所です。
 *   - お客様は必ず笑顔になる
 *   - 責める言葉は一つも書かない
 *   - 助言は必ず前向きな言い方にする
 */

import type { Customer } from '../data/customers';
import {
  flowerById,
  IMPRESSION_LABEL,
  TONE_LABEL,
  type ColorTone,
  type Flower,
  type Impression,
} from '../data/flowers';
import { ribbonById, wrappingById } from '../data/wrapping';
import type { Bouquet } from './types';

export interface Evaluation {
  /** 1〜5。低くても、お客様は笑ってくれる。 */
  smile: number;
  /** 受け取ったときの言葉 */
  words: string[];
  /** ブーケの、いちばん良かったところ */
  praise: string;
  /** 花言葉から拾った、そっと添える一行 */
  meaningNote: string;
  /** 内訳（画面には数字ではなく、言葉として出す） */
  detail: {
    impression: number;
    tone: number;
    volume: number;
    balance: number;
  };
  total: number;
  overBudget: boolean;
}

const VOLUME_TARGET: Record<Customer['wish']['volume'], number> = {
  small: 5,
  medium: 7,
  full: 10,
};

const VOLUME_LABEL: Record<Customer['wish']['volume'], string> = {
  small: '小さめの束',
  medium: 'ほどよい大きさの束',
  full: 'たっぷりとした束',
};

export function bouquetFlowers(bouquet: Bouquet): Flower[] {
  return bouquet.stems.map((stem) => flowerById(stem.flowerId));
}

export function bouquetPrice(bouquet: Bouquet): number {
  const flowers = bouquetFlowers(bouquet).reduce((sum, f) => sum + f.price, 0);
  return flowers + wrappingById(bouquet.wrappingId).price + ribbonById(bouquet.ribbonId).price;
}

/** 束全体がまとう印象。花・紙・リボンのすべてが少しずつ効く。 */
export function bouquetImpressions(bouquet: Bouquet): Map<Impression, number> {
  const weights = new Map<Impression, number>();
  const add = (key: Impression, weight: number) =>
    weights.set(key, (weights.get(key) ?? 0) + weight);

  for (const flower of bouquetFlowers(bouquet)) {
    for (const impression of flower.impressions) add(impression, 1);
  }
  for (const impression of wrappingById(bouquet.wrappingId).impressions) add(impression, 1.4);
  for (const impression of ribbonById(bouquet.ribbonId).impressions) add(impression, 0.9);
  return weights;
}

function toneRatio(bouquet: Bouquet, tones: ColorTone[]): number {
  const flowers = bouquetFlowers(bouquet);
  if (flowers.length === 0) return 0;
  const matched = flowers.filter((flower) => tones.includes(flower.tone)).length;
  return matched / flowers.length;
}

export function evaluate(bouquet: Bouquet, customer: Customer): Evaluation {
  const flowers = bouquetFlowers(bouquet);
  const wish = customer.wish;
  const price = bouquetPrice(bouquet);

  // ---- 雰囲気の重なり
  const weights = bouquetImpressions(bouquet);
  const totalWeight = [...weights.values()].reduce((a, b) => a + b, 0) || 1;
  const wished = wish.impressions.reduce((sum, key) => sum + (weights.get(key) ?? 0), 0);
  const impression = clamp01(wished / (totalWeight * 0.55));

  // ---- 色
  const tone = clamp01(toneRatio(bouquet, wish.tones) / 0.7);

  // ---- 量（多すぎても少なすぎても、責めずにそっと伝える）
  const target = VOLUME_TARGET[wish.volume];
  const volume = clamp01(1 - Math.abs(flowers.length - target) / (target + 3));

  // ---- 束としてのまとまり（主役・寄り添う花・葉もの）
  const roles = new Set(flowers.map((flower) => flower.role));
  const balance = clamp01(
    (roles.has('main') ? 0.45 : 0) +
      (roles.has('filler') || roles.has('sub') ? 0.3 : 0) +
      (roles.has('green') ? 0.25 : 0),
  );

  /*
   * 「好きな花」（16%）を外したぶんを、四つに配り直しました。
   * 見ているのは、雰囲気・色・量・束としてのまとまりだけ。
   * **どれも「特定の花を入れたか」ではありません。**
   */
  const total = impression * 0.38 + tone * 0.26 + volume * 0.17 + balance * 0.19;

  // 花が入ってさえいれば、お客様は必ず笑顔になる。
  const smile = flowers.length === 0 ? 1 : Math.max(2, Math.round(total * 4) + 1);

  const tier: keyof Customer['reactions'] =
    total >= 0.72 ? 'delighted' : total >= 0.45 ? 'happy' : 'grateful';

  return {
    smile: Math.min(5, smile),
    words: customer.reactions[tier],
    praise: buildPraise({ impression, tone, volume, balance }, bouquet, customer),
    meaningNote: buildMeaningNote(flowers),
    detail: { impression, tone, volume, balance },
    total,
    overBudget: price > customer.budget * 1.12,
  };
}

/** いちばん良かったところを、必ず一つ見つけて言葉にする。 */
function buildPraise(
  detail: Evaluation['detail'],
  bouquet: Bouquet,
  customer: Customer,
): string {
  const entries = Object.entries(detail) as [keyof Evaluation['detail'], number][];
  entries.sort((a, b) => b[1] - a[1]);
  const [best] = entries;
  const wrap = wrappingById(bouquet.wrappingId);

  switch (best[0]) {
    case 'impression':
      return `${customer.wish.impressions
        .map((key) => IMPRESSION_LABEL[key])
        .join('で、')}雰囲気が、ちゃんと束から立ちのぼっています。`;
    case 'tone':
      return `${customer.wish.tones
        .map((key) => TONE_LABEL[key])
        .join('と')}が気持ちよくそろっていて、目にやさしい束です。`;
    case 'volume':
      return `${VOLUME_LABEL[customer.wish.volume]}で、腕におさまりがいい形になりました。`;
    case 'balance':
      return '主役の花と、それを支える花の役割がはっきりしていて、束に奥行きがあります。';
    default:
      return `${wrap.name}の質感が、花の色をそっと引き立てています。`;
  }
}

/*
 * ── 助言を、やめました ──────────────────────────────────
 *
 * 「あと2本ほど足すと、ほどよい大きさの束になって見映えします。」
 * 「ユーカリのような葉ものを一本足すと、束が落ち着きます。」
 *
 * 責めない言い方に気をつけて書いたつもりでしたが、
 * **これは指導です。** 上手・下手のある行為にしてしまいます。
 * このゲームは「うまく組めたか」ではなく
 * 「この人に、この花を」で作られています。
 *
 * 数でも効いていました。一日に3〜5組いらっしゃるので、
 * 一年（20日）で **80回**読むことになります。
 *
 *   助言ひとつ  約40字
 *   80回で      3,200字  ── 文庫本で6ページぶんの「直したほうがいい点」
 *
 * `buildAdvice` と、それだけが使っていた `suggestFlowerFor` を消しました。
 * 残したのは、褒めるところ（praise）と、花言葉の一行（meaningNote）です。
 */

/** 束に入った花言葉から、そっと一行を選ぶ。 */
function buildMeaningNote(flowers: Flower[]): string {
  if (flowers.length === 0) return '';
  const counted = new Map<string, Flower>();
  for (const flower of flowers) counted.set(flower.id, flower);
  const list = [...counted.values()];
  const chosen = list[Math.floor(list.length / 2)];
  return `${chosen.name}の花言葉は「${chosen.meanings[0]}」。この束は、その言葉を連れていきます。`;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

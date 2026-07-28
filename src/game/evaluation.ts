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
  FLOWERS,
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
  /** 「こんな感じだと、もっと嬉しいかも」 */
  advice: string;
  /** 花言葉から拾った、そっと添える一行 */
  meaningNote: string;
  /** 内訳（画面には数字ではなく、言葉として出す） */
  detail: {
    impression: number;
    tone: number;
    loved: number;
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

  // ---- 好きな花
  const lovedIn = (wish.loved ?? []).filter((id) =>
    flowers.some((flower) => flower.id === id),
  ).length;
  const loved = wish.loved?.length ? clamp01(lovedIn / Math.min(2, wish.loved.length)) : 1;

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

  const total =
    impression * 0.32 + tone * 0.22 + loved * 0.16 + volume * 0.14 + balance * 0.16;

  // 花が入ってさえいれば、お客様は必ず笑顔になる。
  const smile = flowers.length === 0 ? 1 : Math.max(2, Math.round(total * 4) + 1);

  const tier: keyof Customer['reactions'] =
    total >= 0.72 ? 'delighted' : total >= 0.45 ? 'happy' : 'grateful';

  return {
    smile: Math.min(5, smile),
    words: customer.reactions[tier],
    praise: buildPraise({ impression, tone, loved, volume, balance }, bouquet, customer),
    advice: buildAdvice({ impression, tone, loved, volume, balance }, bouquet, customer),
    meaningNote: buildMeaningNote(flowers),
    detail: { impression, tone, loved, volume, balance },
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
    case 'loved':
      return `${(customer.wish.loved ?? [])
        .map((id) => flowerById(id).name)
        .join('と')}が入っているのが、なによりうれしいところ。`;
    case 'volume':
      return `${VOLUME_LABEL[customer.wish.volume]}で、腕におさまりがいい形になりました。`;
    case 'balance':
      return '主役の花と、それを支える花の役割がはっきりしていて、束に奥行きがあります。';
    default:
      return `${wrap.name}の質感が、花の色をそっと引き立てています。`;
  }
}

/** 助言は、足りないところではなく「もっと嬉しくなる方向」を書く。 */
function buildAdvice(
  detail: Evaluation['detail'],
  bouquet: Bouquet,
  customer: Customer,
): string {
  const flowers = bouquetFlowers(bouquet);
  const entries = Object.entries(detail) as [keyof Evaluation['detail'], number][];
  entries.sort((a, b) => a[1] - b[1]);
  const [weakest] = entries;
  const wish = customer.wish;

  if (flowers.length === 0) {
    return '花瓶から、気になった花を一本だけ取ってみるところから始めてみましょう。';
  }

  switch (weakest[0]) {
    case 'impression': {
      const key = wish.impressions[0];
      const hint = suggestFlowerFor((flower) => flower.impressions.includes(key), flowers);
      return `もう少し${IMPRESSION_LABEL[key]}印象にするなら、${hint}を足してみると近づきそうです。`;
    }
    case 'tone': {
      const toneKey = wish.tones[0];
      const hint = suggestFlowerFor((flower) => flower.tone === toneKey, flowers);
      return `${TONE_LABEL[toneKey]}をもう少し増やすと、より望みに近い表情になりそうです。${hint}などいかがでしょう。`;
    }
    case 'loved': {
      const missing = (wish.loved ?? []).find(
        (id) => !flowers.some((flower) => flower.id === id),
      );
      return missing
        ? `${flowerById(missing).name}を一本そえると、想いがまっすぐ届きそうです。`
        : 'このままでも十分に伝わります。次はもう一種類だけ、冒険してみても。';
    }
    case 'volume': {
      const target = VOLUME_TARGET[wish.volume];
      return flowers.length < target
        ? `あと${target - flowers.length}本ほど足すと、${VOLUME_LABEL[wish.volume]}になって見映えします。`
        : `少し本数を減らすと、一本ずつの表情がもっと見えるようになります。`;
    }
    case 'balance': {
      const roles = new Set(flowers.map((flower) => flower.role));
      if (!roles.has('main')) return '主役になる大きな花を一本決めると、束がぐっとまとまります。';
      if (!roles.has('green')) return 'ユーカリのような葉ものを一本足すと、束が落ち着きます。';
      return 'かすみ草のような小さな花ですきまを埋めると、ふんわり見えます。';
    }
    default:
      return 'いまのままでも素敵です。次は包み紙を変えて、印象の違いを楽しんでみましょう。';
  }
}

function suggestFlowerFor(
  predicate: (flower: Flower) => boolean,
  already: Flower[],
): string {
  const owned = new Set(already.map((flower) => flower.id));
  const candidate = FLOWERS.find((flower) => predicate(flower) && !owned.has(flower.id));
  return (candidate ?? FLOWERS.find(predicate) ?? already[0]).name;
}

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

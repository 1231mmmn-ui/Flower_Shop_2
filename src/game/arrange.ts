/**
 * 花を束ねる。
 *
 * 花屋さんの組み方にならって、
 *   葉もの・小花は外側と奥に、主役の花は中心と手前に置く。
 *
 * ── 動かせなくしました ────────────────────────────────
 *
 * 以前はここで組んだあと、プレイヤーが一本ずつ動かせました。
 * 実機で触ってみると、それは**画像を配置する操作**でした。
 * うまく置けても嬉しくなく、置けないと自分が下手に思えます。
 *
 * いまは、こちらが最後まで組んだ束を**三つの形**で出して、
 * プレイヤーはその中から好きな形を選びます（→ src/game/styles.ts）。
 * 三つとも成立していて、優劣も正解もありません。
 */

import { flowerById, type FlowerRole } from '../data/flowers';
import { styleById } from './styles';
import type { BouquetStem, BouquetStyleId } from './types';

/** 外側に置きたいものほど大きい値。 */
const ROLE_OUTWARD: Record<FlowerRole, number> = {
  green: 1.0,
  filler: 0.78,
  sub: 0.42,
  main: 0.0,
};

export function makeStem(flowerId: string, seed = Math.random()): BouquetStem {
  return {
    uid: `${flowerId}-${Math.round(seed * 1e9).toString(36)}`,
    flowerId,
    angle: 0,
    reach: 0.5,
    depth: 0.5,
    sway: (seed * 2 - 1) * 4,
    scale: 0.94 + seed * 0.12,
  };
}

/**
 * 束を組む。
 *
 * 同じ花・同じ形なら、**必ず同じ束になります。**
 * 選び直して戻ってきたときに形が変わっていたら、
 * それは選んだことにならないので。
 * （一本ずつの表情は `sway` から作ります ── 花を取ったときに
 *   一度だけ決まる値なので、組み直しても揺れません。）
 */
export function arrange(stems: BouquetStem[], styleId: BouquetStyleId): BouquetStem[] {
  const style = styleById(styleId);
  const ordered = [...stems].sort(
    (a, b) =>
      ROLE_OUTWARD[flowerById(b.flowerId).role] - ROLE_OUTWARD[flowerById(a.flowerId).role],
  );

  // 外向きのものから、扇の端 → 中心へ交互に配置していく。
  const slots = fanSlots(ordered.length);
  const placed = new Map<string, BouquetStem>();

  ordered.forEach((stem, index) => {
    const flower = flowerById(stem.flowerId);
    const outward = ROLE_OUTWARD[flower.role];
    const slot = slots[index];
    const edge = Math.abs(slot);          // 0 = まんなか、1 = はし
    const middle = 1 - edge;              // まんなかほど大きい
    const wobble = stem.sway * style.scatter;

    placed.set(stem.uid, {
      ...stem,
      angle: slot * style.spread + wobble,
      // 中心は `crown` のぶん高く伸び、外側は `drop` のぶん落ちる。
      reach:
        0.56 +
        middle * style.crown -
        edge * style.drop +
        outward * 0.12 +
        wobble * 0.006,
      depth: 1 - edge * 0.55 - outward * 0.35,
      scale: (0.92 + middle * 0.16) * flower.stature * 0.95,
    });
  });

  return stems.map((stem) => placed.get(stem.uid) ?? stem);
}

/** 端から中心へ向かって埋まっていく、扇の位置（-1〜1）。 */
function fanSlots(count: number): number[] {
  if (count <= 1) return [0];
  const raw: number[] = [];
  for (let i = 0; i < count; i += 1) {
    raw.push((i / (count - 1)) * 2 - 1);
  }
  // 外側 → 中心の順に並べ替える
  return raw
    .map((value, index) => ({ value, index }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .map((entry) => entry.value);
}

/** 描画順。奥のものから先に描く。 */
export function byDepth(stems: BouquetStem[]): BouquetStem[] {
  return [...stems].sort((a, b) => a.depth - b.depth);
}

/**
 * 花を束ねる。
 *
 * 花屋さんの組み方にならって、
 *   葉もの・小花は外側と奥に、主役の花は中心と手前に置く。
 * 自動で置いたあと、プレイヤーが自由に動かせる。
 */

import { flowerById, type FlowerRole } from '../data/flowers';
import type { BouquetStem } from './types';

/** 外側に置きたいものほど大きい値。 */
const ROLE_OUTWARD: Record<FlowerRole, number> = {
  green: 1.0,
  filler: 0.78,
  sub: 0.42,
  main: 0.0,
};

const SPREAD = 33; // 扇の広がり（度）

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
 * 束全体を組み直す。
 * 手で動かした花は `pinned` に渡すと位置を保つ。
 */
export function arrange(stems: BouquetStem[], pinned: Set<string> = new Set()): BouquetStem[] {
  const free = stems.filter((stem) => !pinned.has(stem.uid));
  const ordered = [...free].sort(
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
    placed.set(stem.uid, {
      ...stem,
      angle: slot * SPREAD + stem.sway * 0.5,
      reach: 0.50 + Math.abs(slot) * 0.26 + outward * 0.14,
      depth: 1 - Math.abs(slot) * 0.55 - outward * 0.35,
      scale: (0.92 + (1 - Math.abs(slot)) * 0.16) * flower.stature * 0.95,
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

/** 手前に出す。重なりの順番だけを入れ替える。 */
export function bringForward(stems: BouquetStem[], uid: string): BouquetStem[] {
  return stems.map((stem) =>
    stem.uid === uid ? { ...stem, depth: Math.min(1, stem.depth + 0.34) } : stem,
  );
}

/** 描画順。奥のものから先に描く。 */
export function byDepth(stems: BouquetStem[]): BouquetStem[] {
  return [...stems].sort((a, b) => a.depth - b.depth);
}

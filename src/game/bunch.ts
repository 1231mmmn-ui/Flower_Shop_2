/**
 * 束ねる ── 描くときの、一本一本。
 *
 * ── なぜ「配置」に見えていたか ────────────────────────────
 *
 * これまでは、プレイヤーが取った花の数だけ絵を並べていました。
 * 3〜5本です。**花屋の花束は、3〜5本では組みません。**
 *
 * 実際の手結びの束は、主役が3〜5輪、それを囲む花が10輪前後、
 * すきまを埋める小花と葉ものが更に何本も入って、
 * ぜんぶで20〜40本になります。だから
 *
 *   ・花どうしが重なる
 *   ・前後（手前の花、奥の花）ができる
 *   ・輪郭が「かたまり」になる
 *
 * 3本を扇状に開いただけでは、どれも起きません。
 * 一本ずつのあいだが空いていて、**紙の前に花を三つ置いた**絵になります。
 *
 * ── 数えるものと、描くものを分ける ──────────────────────
 *
 * ここでやるのは**描くときだけの増やし方**です。
 *
 *   `bouquet.stems`   取った花。値段・記録・お客さまの受け取り方は、こちら
 *   `bunch()` の返り値 描く花。同じ花を何本かに増やして、束にする
 *
 * 増やしても値段は上がりません。
 * 「一本 ¥330 のチューリップを取ったら、絵では4本になっていた」
 * ── 花屋で「チューリップを入れてください」と言ったときに
 * 出てくるのは、まさにその姿です。**束は、本数を数えるものではありません。**
 */

import { flowerById, type FlowerRole } from '../data/flowers';
import { styleById } from './styles';
import type { BouquetStem, BouquetStyleId } from './types';

/** 外側に置きたいものほど大きい値。 */
const ROLE_OUTWARD: Record<FlowerRole, number> = {
  green: 1.0,
  filler: 0.82,
  sub: 0.44,
  main: 0.0,
};

/**
 * 一種につき、何本描くか。
 *
 * 花屋の束の組み方どおりです。主役は数輪、
 * 寄り添う花はその倍、すきまを埋める小花と葉ものはたっぷり。
 */
const COPIES: Record<FlowerRole, number> = {
  main: 3,
  sub: 4,
  filler: 6,
  green: 5,
};

/** 描く上限。多すぎると重くなるだけで、見た目は変わらない。 */
const MAX_DRAWN = 26;

export interface DrawnStem {
  key: string;
  flowerId: string;
  /** 扇の角度（度）。0 が真上。 */
  angle: number;
  /** 結び目からの伸び */
  reach: number;
  /** 0 が奥、1 が手前 */
  depth: number;
  scale: number;
}

/**
 * 花を一本、作業台に置く。
 *
 * ここで持つのは「どの花か」だけです。
 * どこにどう挿さるかは、描くときに決まります（→ `bunch`）。
 */
export function makeStem(flowerId: string, seed = Math.random()): BouquetStem {
  return { uid: `${flowerId}-${Math.round(seed * 1e9).toString(36)}`, flowerId };
}

/** 0〜1 の、ぶれない乱数。同じ束なら何度描いても同じ形。 */
function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * 束を組む。
 *
 * 同じ花・同じ形なら、**必ず同じ束になります。**
 * 種は花のuidから作るので、選び直して戻ってきても形は変わりません。
 */
export function bunch(stems: BouquetStem[], styleId: BouquetStyleId): DrawnStem[] {
  const style = styleById(styleId);
  if (stems.length === 0) return [];

  // 外側に置きたいものから順に並べる。葉もの → 小花 → 寄り添う花 → 主役。
  const ordered = [...stems].sort(
    (a, b) =>
      ROLE_OUTWARD[flowerById(b.flowerId).role] - ROLE_OUTWARD[flowerById(a.flowerId).role],
  );

  // 何本ずつ描くか。上限を超えるときは、全体を同じ割合で減らす。
  const wanted = ordered.map((stem) => COPIES[flowerById(stem.flowerId).role]);
  const total = wanted.reduce((a, b) => a + b, 0);
  const shrink = total > MAX_DRAWN ? MAX_DRAWN / total : 1;
  const counts = wanted.map((n) => Math.max(1, Math.round(n * shrink)));

  const drawn: DrawnStem[] = [];
  let seed = 0;

  ordered.forEach((stem, index) => {
    const flower = flowerById(stem.flowerId);
    const outward = ROLE_OUTWARD[flower.role];
    const count = counts[index];

    for (let c = 0; c < count; c += 1) {
      seed += 1;
      const r1 = rand(seed * 3.1 + index);
      const r2 = rand(seed * 7.7 + index * 2);
      const r3 = rand(seed * 11.3 + index * 3);

      /*
       * 束の中の居場所を、二つの数で決めます。
       *
       *   side   −1（左端）〜 +1（右端）。同じ種を左右に散らす
       *   ring   0（中心・手前）〜 1（外側・奥）
       *
       * 主役は ring 0 のあたり、葉ものは ring 1 のあたり。
       * 同じ種の中でも少しずつずらして、**列に見せない**ようにします。
       */
      const spanCenter = count === 1 ? 0 : (c / (count - 1)) * 2 - 1;
      const side = spanCenter * (0.35 + outward * 0.65) + (r1 - 0.5) * 0.5;
      const ring = Math.min(1, Math.max(0, outward + (r2 - 0.5) * 0.34));

      /*
       * ── 重なりは、角度ではなく「伸びの差」で作ります ──────
       *
       * 角度だけで散らすと、花の頭が円周上に等間隔で並び、
       * どれだけ本数を増やしても**輪**にしかなりません。
       * 伸びを一本ずつ変えると、頭が前後にずれて重なり、
       * かたまりになります。
       */
      const angle = side * style.spread + (r3 - 0.5) * 9;
      /*
       * 0.54 → 0.70。**紙の口と花のあいだに、茎を見せるため。**
       * 0.54 では花の頭が紙の口とほぼ同じ高さに来て、
       * 紙のふちで花が水平に切られていました。
       * 花屋の束は、紙の口から茎が伸びて、その先に花があります。
       */
      const reach =
        0.64 +
        (1 - ring) * style.crown -
        ring * style.drop -
        // 同じ角度の花を、少しずつ沈める。これが重なりを作る。
        (r2 - 0.5) * 0.20 -
        Math.abs(side) * 0.10;

      // 手前ほど大きく、はっきり。奥は小さく、沈む。
      const depth = Math.min(1, Math.max(0, 1 - ring * 0.9 - (r1 - 0.5) * 0.2));

      drawn.push({
        key: `${stem.uid}-${c}`,
        flowerId: stem.flowerId,
        angle,
        reach,
        depth,
        scale: (0.84 + depth * 0.26) * flower.stature * 0.95,
      });
    }
  });

  // 奥から順に描く。
  return drawn.sort((a, b) => a.depth - b.depth);
}

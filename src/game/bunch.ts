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
 * ── それでも「配置」に見えていた、二つの理由 ──────────────────
 *
 * 本数を増やしたあとも、まだ「花を紙の中に配置したもの」に見えました。
 * 理由は二つでした。
 *
 * 一．**全部の花が、いつも正面を向いていました。**
 *     同じ一枚の絵を回転させて並べているだけなので、
 *     どれだけ本数を増やしても「同じ顔が並んでいる」ままでした。
 *     → `faceX`（横の詰まり）で、正面・半身・横向きを混ぜます。
 *
 * 二．**葉ものが、左右の端にだけ、対になって飛び出していました。**
 *     `role` ごとに自分の花だけで扇を作っていたので、葉ものは
 *     葉もの同士で綺麗に整列し、「左右対称の飾り」に見えました。
 *     → 全部の花を**ひとつの輪**に混ぜてから位置を配るようにしました。
 *
 * ── 数えるものと、描くものを分ける ──────────────────────
 *
 *   `bouquet.stems`   取った花。値段・記録・お客さまの受け取り方は、こちら
 *   `bunch()` の返り値 描く花。同じ花を何本かに増やして、束にする
 *
 * 増やしても値段は上がりません。**束は、本数を数えるものではありません。**
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
  /** 花の向き。1.0＝正面、0.5に近いほど横向き。 */
  faceX: number;
  /** 花そのものの、ごく小さな傾き（度）。頭のあたりを軸に回す。 */
  faceRot: number;
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

interface Copy {
  stem: BouquetStem;
  outward: number;
  seed: number;
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

  // 何本ずつ描くか。上限を超えるときは、全体を同じ割合で減らす。
  const wanted = stems.map((stem) => COPIES[flowerById(stem.flowerId).role]);
  const total = wanted.reduce((a, b) => a + b, 0);
  const shrink = total > MAX_DRAWN ? MAX_DRAWN / total : 1;

  // ── 全部の花を、ひとつの輪に混ぜます ──────────────────────
  //
  // 前は「役割ごとに自分の花だけで扇を作る」やり方でした。
  // 葉ものはいつも葉もの同士で並ぶので、束のどこにいても
  // 「葉ものの列」に見えました。ここで一度、全部の複製を
  // ひとつの配列にしてから、まとめて輪の位置（side）を配ります。
  // 主役も、寄り添う花も、葉ものも、隣り合わせになります。
  const copies: Copy[] = [];
  stems.forEach((stem, index) => {
    const flower = flowerById(stem.flowerId);
    const outward = ROLE_OUTWARD[flower.role];
    const count = Math.max(1, Math.round(wanted[index] * shrink));
    for (let c = 0; c < count; c += 1) {
      copies.push({ stem, outward, seed: index * 97 + c * 7 + 1 });
    }
  });

  // 輪の中の位置は、束全体で一度だけシャッフルする。
  // 同じ乱数式でも、並べる前の順番（役割ごとに固まっている）を
  // 崩しておかないと、輪の位置がまた役割ごとに固まってしまう。
  const order = copies
    .map((copy, i) => ({ copy, key: rand(i * 13.7 + 4.2) }))
    .sort((a, b) => a.key - b.key)
    .map((entry) => entry.copy);

  const drawn: DrawnStem[] = order.map((copy, i) => {
    const { stem, outward, seed } = copy;
    const flower = flowerById(stem.flowerId);
    const r1 = rand(seed * 3.1 + 11);
    const r2 = rand(seed * 7.7 + 23);
    const r3 = rand(seed * 11.3 + 37);
    const r4 = rand(seed * 5.3 + 53);

    /*
     * 束の中の居場所を、二つの数で決めます。
     *
     *   side   −1（左端）〜 +1（右端）。輪の位置（もう役割で固めない）
     *   ring   0（中心・手前）〜 1（外側・奥）。役割の「外向きさ」＋ばらつき
     *
     * side は輪全体のインデックスから作るので、主役の隣に葉ものが
     * 来ることもあれば、葉もの同士が隣り合うこともあります。
     * ── ここが**乱数の直線**にならないよう、大きく散らします。
     */
    /*
     * side は、必ず −1〜1 に収めます。
     *
     * spanCenter（最大 ±1）に乱数の散らし（最大 ±0.95）を足すと、
     * 合計で ±1.9 まで届いてしまい、束の外側で「自然に広がる」
     * （spread 62°）と組むと、花が90度以上倒れて画面の外へ
     * 飛んでいくことがありました。**結び目は原点ですが、
     * 傾きが行き過ぎたら束ではなく破片になります。**
     */
    const spanCenter = order.length <= 1 ? 0 : (i / (order.length - 1)) * 2 - 1;
    const side = Math.max(
      -1,
      Math.min(1, spanCenter * 0.55 + (r1 - 0.5) * (0.9 + outward * 0.5)),
    );
    const ring = Math.min(1, Math.max(0, outward * 0.72 + (r2 - 0.5) * 0.5));

    /*
     * ── 重なりは、角度ではなく「伸びの差」で作ります ──────
     *
     * 角度だけで散らすと、花の頭が円周上に等間隔で並び、
     * どれだけ本数を増やしても**輪**にしかなりません。
     * 伸びを一本ずつ変えると、頭が前後にずれて重なり、
     * かたまりになります。
     */
    // 端まで振り切っても、結び目から見て斜め45度ほどまで。
    // それ以上倒すと、花瓶挿しではなく倒れた花に見える。
    const angle = Math.max(-52, Math.min(52, side * style.spread + (r3 - 0.5) * 11));
    const reach =
      0.64 +
      (1 - ring) * style.crown -
      ring * style.drop -
      // 同じ角度の花を、少しずつ沈める。これが重なりを作る。
      (r2 - 0.5) * 0.20 -
      Math.abs(side) * 0.10;

    // 手前ほど大きく、はっきり。奥は小さく、沈む。
    const depth = Math.min(1, Math.max(0, 1 - ring * 0.95 - (r1 - 0.5) * 0.2));

    /*
     * ── 向き。正面・半身・横向きを混ぜます ────────────────
     *
     * 同じ一枚の絵しか無いので、**横幅だけを詰めて**回って見せます。
     * 主役（outward が低い）は、顔がいちばん見えてほしいので
     * 正面寄りに残します。外側へ行くほど、半身・横向きを増やします。
     * 詰めすぎると花の輪郭が壊れるので、下限は 0.52 まで。
     */
    const turn = Math.max(0, Math.min(1, outward * 0.55 + r4 * 0.6 - 0.15));
    const faceX = 1 - turn * 0.46;
    const faceRot = (r4 - 0.5) * 10 * (0.4 + turn);

    return {
      key: `${stem.uid}-${i}`,
      flowerId: stem.flowerId,
      angle,
      reach,
      depth,
      scale: (0.82 + depth * 0.30) * flower.stature * 0.95,
      faceX,
      faceRot,
    };
  });

  // 奥から順に描く。
  return drawn.sort((a, b) => a.depth - b.depth);
}

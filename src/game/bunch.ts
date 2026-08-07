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
 * ── 本数を増やしても、まだ「配置」に見えていた ────────────────
 *
 * 実機で確認すると、まだ問題がありました。
 *
 *   一．同じ花の複製が、みな似た奥行きに落ち、横一列に並んで見えた
 *       （前後のばらけが「役割＋乱数」まかせで、同じ花どうしが
 *       たまたま近い並びになっても止める仕組みが無かった）
 *   二．アジサイのような面の大きな花が、他の主役と同じ扱いで
 *       外側へ飛ばされ、コラージュの「貼り紙」に見えた
 *   三．ユーカリが役割だけで散らされるので、左右どちらへも均等に
 *       出てしまい、対称な羽根に見えた
 *   四．主役はほぼ正面しか向かず、重なっても奥行きが出なかった
 *   五．`style.scatter`（一本ずつのばらつき）を定義だけして、
 *       実際の計算では一度も使っていなかった
 *
 * ここから先は、「花ごとに前列・中列・奥列へ必ず分ける」
 * 「面の大きな花は中心寄りへ引き戻す」「葉ものは片側だけへ抜く」
 * 「主役にも向きのばらつきを持たせる」という**意図的な帯**を先に決め、
 * 乱数はその帯の中だけで小さく揺らす役に回しました。
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

/**
 * 面が大きく、輪郭がはっきりした花。
 *
 * バラやラナンキュラスと同じ「主役」でも、アジサイは一輪の見た目の
 * 面積がずっと広いので、他の主役とまったく同じ扱いで外側へ飛ばすと、
 * 花束の縁に「貼り紙」を置いたように見えます。中心寄りへ引き戻し、
 * 手前へ出過ぎないようにして、他の主役の後ろにも潜れるようにします。
 */
const BULKY_FLOWERS = new Set(['hydrangea']);

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
  /** 同じ花の中で、何本目の複製か（0始まり）。 */
  copyIndex: number;
  isGreen: boolean;
  isBulky: boolean;
  /** 0＝手前列、1＝中列、2＝奥列。同じ花のコピーは必ず別の列に落ちる。 */
  band: 0 | 1 | 2;
}

/** 手前・中間・奥の、奥行き（ring）の目安。乱数はこの中だけで揺れる。 */
const BAND_RING: [number, number, number] = [0.12, 0.46, 0.82];

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
    // 同じ花の中で、列（手前/中/奥）を回す順番を花ごとにずらす。
    // 全種類が同じ順（前→中→奥）だと、束全体が層になって
    // 「同じ高さの輪が3つ重なった」ように見えてしまう。
    const bandOffset = Math.floor(rand(index * 53.1 + 7) * 3);
    for (let c = 0; c < count; c += 1) {
      copies.push({
        stem,
        outward,
        seed: index * 97 + c * 7 + 1,
        copyIndex: c,
        isGreen: flower.role === 'green',
        isBulky: BULKY_FLOWERS.has(flower.id),
        band: ((c + bandOffset) % 3) as 0 | 1 | 2,
      });
    }
  });

  // 輪の中の位置は、束全体で一度だけシャッフルする。
  // 同じ乱数式でも、並べる前の順番（役割ごとに固まっている）を
  // 崩しておかないと、輪の位置がまた役割ごとに固まってしまう。
  const order = copies
    .map((copy, i) => ({ copy, key: rand(i * 13.7 + 4.2) }))
    .sort((a, b) => a.key - b.key)
    .map((entry) => entry.copy);

  /*
   * 葉ものが外へ抜ける向きを、束ひとつにつき片側だけに決めます。
   * 役割だけで散らすと、左右どちらにも同じくらい葉が出て、
   * 対称な羽根のように見えていました。
   */
  const greenEscapeSign = rand(order.length * 3.7 + 9.1) < 0.5 ? -1 : 1;

  // 一本ずつのばらつき。style.scatter を実際に効かせる。
  const jitter = 0.55 + style.scatter * 0.85;

  const drawn: DrawnStem[] = order.map((copy, i) => {
    const { stem, outward, seed, copyIndex, isGreen, isBulky, band } = copy;
    const flower = flowerById(stem.flowerId);
    const r1 = rand(seed * 3.1 + 11);
    const r2 = rand(seed * 7.7 + 23);
    const r3 = rand(seed * 11.3 + 37);
    const r4 = rand(seed * 5.3 + 53);
    const r5 = rand(seed * 17.9 + 61);

    /*
     * 束の中の居場所を、二つの数で決めます。
     *
     *   side   −1（左端）〜 +1（右端）。輪の位置（もう役割で固めない）
     *   ring   0（中心・手前）〜 1（外側・奥）。列（band）＋ばらつき
     */
    const spanCenter = order.length <= 1 ? 0 : (i / (order.length - 1)) * 2 - 1;

    // 主役は、外へ振れる幅そのものを抑える。花の顔どうしが
    // 重なって見えることを、扇に開くことより優先するため。
    const roleSpreadFactor = outward === 0 ? style.mainSpreadFactor : 1;

    let side = Math.max(
      -1,
      Math.min(
        1,
        spanCenter * 0.55 * roleSpreadFactor +
          (r1 - 0.5) * (0.9 + outward * 0.5) * roleSpreadFactor,
      ),
    );

    // 面の大きな花は、中心寄りへ引き戻す（縁の「貼り紙」にしない）。
    if (isBulky) side *= 0.62;

    let ring = Math.min(1, Math.max(0, BAND_RING[band] + (r2 - 0.5) * 0.16 * jitter + outward * 0.08));

    // 面の大きな花は、手前列以外では少し奥へ沈め、主役の後ろに潜らせる。
    if (isBulky && band !== 0) ring = Math.min(1, ring + 0.14);

    let isEscapeGreen = false;
    if (isGreen) {
      if (copyIndex === 0) {
        // 一本だけ、外周から自然に抜ける補助線にする。
        isEscapeGreen = true;
        side = greenEscapeSign * (0.74 + r1 * 0.30);
        ring = Math.min(1, 0.16 + r2 * 0.22);
      } else {
        // 残りは、根もとを埋める葉として奥へ沈め、左右対称の羽根にしない。
        side *= 0.4;
        ring = Math.min(1, 0.6 + r2 * 0.3);
      }
    }

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
    const angle = Math.max(
      -52,
      Math.min(52, side * style.spread + (r3 - 0.5) * 11 * jitter),
    );
    let reach =
      0.64 +
      (1 - ring) * style.crown -
      ring * style.drop -
      // 同じ角度の花を、少しずつ沈める。これが重なりを作る。
      (r2 - 0.5) * 0.20 * jitter -
      Math.abs(side) * 0.10;

    if (isEscapeGreen) reach += 0.10 + r5 * 0.08;

    // 手前ほど大きく、はっきり。奥は小さく、沈む。
    const depth = Math.min(1, Math.max(0, 1 - ring * 0.95 - (r1 - 0.5) * 0.2));

    /*
     * ── 向き。正面・半身・横向きを混ぜます ────────────────
     *
     * 同じ一枚の絵しか無いので、**横幅だけを詰めて**回って見せます。
     * 主役でも、いつも正面のままだと重なりに奥行きが出ないので、
     * 役割に関わらず一定の幅で回転させます。詰めすぎると花の輪郭が
     * 壊れるので、下限は 0.5 まで。
     */
    const turn = Math.max(0, Math.min(1, outward * 0.35 + r4 * 0.75 - 0.12));
    const faceX = 1 - turn * 0.46;
    const faceRot = (r4 - 0.5) * 10 * (0.4 + turn) * jitter;

    let scale = (0.82 + depth * 0.30) * flower.stature * 0.95;
    // 根もとを埋める葉は、主張しすぎないよう少し小さく。
    if (isGreen && !isEscapeGreen) scale *= 0.84;

    return {
      key: `${stem.uid}-${i}`,
      flowerId: stem.flowerId,
      angle,
      reach,
      depth,
      scale,
      faceX,
      faceRot,
    };
  });

  // 奥から順に描く。
  return drawn.sort((a, b) => a.depth - b.depth);
}

/**
 * 束ねる ── 描くときの、一本一本。
 *
 * ── 2026-08-13、「結束点から組む」考え方に作り直しました ─────────
 *
 * それまでは「花の置き場所を先に決めて、そこに一輪素材を置く」
 * 考え方でした。角度・伸びの散らばり方を役割ごとの数値（spread、
 * mainSpreadFactor、peripheralEscape…）で細かく調整していけば
 * いつか「花束」に見えるはずだと思っていましたが、実機で見るたびに
 * 「一輪素材を複数本並べて、紙を重ねたもの」という印象が残りました。
 *
 * 数値をどれだけ足しても直らなかった理由は、**花の置き場所ではなく
 * 茎の集まる先を決めていなかった**ことだと思います。花屋の束は、
 * 逆の順番で組まれます。
 *
 *   ① 結束点（紙の結び目のすぐ上）を決める
 *   ② そこへ向けて、すべての茎が集まる
 *   ③ 結束点から放射状に伸びた先に、花の顔が並ぶ
 *   ④ その花の顔の並び方が、丸い／高い／自然に広がる、という外形を作る
 *
 * ここでは、結束点から見た「主役の花が面を作る位置」
 * （`style.coreAttractors`）と「葉物が外へ抜ける位置」
 * （`style.edgeAttractors`）を先に決め（→ src/game/styles.ts）、
 * 選んだ花をその役割（主役・寄り添う花や小花・葉物）に応じて
 * 位置へ収めていきます。乱数は、位置を決めるためではなく、
 * 決まった位置のまわりで小さく揺らすためだけに使います。
 *
 * ── 主役・脇役・葉物の3層 ────────────────────────────────
 *
 *   主役の花（role: main）    → coreAttractors に収まり、「面」を作る
 *   寄り添う花・小花（sub/filler） → 主役の隙間（coreAttractors の
 *                                 あいだ）を埋める
 *   葉物・ライン（green）      → edgeAttractors へ外側へ抜ける
 *
 * ── 「全部見せる」のではなく「選んだ種は必ず1本、顔が分かる」────
 *
 * 同じ花を何本も描くとき、1本目（copyIndex 0）だけは必ず前寄りの
 * 奥行きに置きます。2本目以降は、他の花に隠れて構いません
 * ── むしろ隠れるくらいのほうが「一つの塊」に見えます。
 *
 * ── 数えるものと、描くものを分ける ──────────────────────
 *
 *   `bouquet.stems`   取った花。値段・記録・お客さまの受け取り方は、こちら
 *   `bunch()` の返り値 描く花。同じ花を何本かに増やして、束にする
 *
 * 増やしても値段は上がりません。**束は、本数を数えるものではありません。**
 */

import { flowerById, FLOWER_VARIANT_COUNT, type FlowerRole } from '../data/flowers';
import { styleById, type Attractor } from './styles';
import type { BouquetStem, BouquetStyleId } from './types';

/**
 * 役割ごとの、見た目の大きさの重み。
 *
 * 主役も脇役も同じ奥行きに落ちれば同じ大きさ、では「自然に主役」に
 * 見えない。大きさそのものに主役・脇役の重みを持たせる。
 */
const ROLE_SCALE: Record<FlowerRole, number> = {
  main: 1.08,
  sub: 0.92,
  filler: 0.70,
  green: 0.84,
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
 * 面積がずっと広いので、他の主役と同じ本数を描くと「巨大なアジサイが
 * 何個も並ぶ」ことになる。核となる位置は1つだけ使い、複製は
 * その周りに控えめに沈める（→ 下の isBulky 分岐）。
 */
const BULKY_FLOWERS = new Set(['hydrangea']);

export interface DrawnStem {
  key: string;
  flowerId: string;
  /** 結束点から見た角度（度）。0 が真上。 */
  angle: number;
  /** 結束点からの伸び */
  reach: number;
  /** 0 が奥、1 が手前 */
  depth: number;
  scale: number;
  /** 花の向き。1.0＝正面、0.5に近いほど横向き。 */
  faceX: number;
  /** 花そのものの、ごく小さな傾き（度）。頭のあたりを軸に回す。 */
  faceRot: number;
  /**
   * −1（左端）〜 +1（右端）。紙の折り返しと前後関係を作るのに使う
   * （→ Bouquet.tsx）。外側の花ほど、紙の山（側面の折り返し）の
   * 後ろに回り込ませたい。
   */
  side: number;
  /**
   * 同じ花でも別角度・別姿勢の絵を持つ花（→ src/data/flowers.ts の
   * FLOWER_VARIANT_COUNT）で、どの1枚を使うか。0＝基準の絵。
   * 用意が無い花は常に0（`assets/paths.ts` の `flowerVariant` が
   * そのまま `flower()` と同じパスを返す）。
   */
  variant: number;
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

/** 花の uid から、束ごとにぶれない種を作る。 */
function stemsHash(stems: BouquetStem[]): number {
  let h = 0;
  stems.forEach((s, i) => {
    for (let c = 0; c < s.uid.length; c += 1) {
      h += s.uid.charCodeAt(c) * (i + 1) * (c + 1);
    }
  });
  return h;
}

interface RawStem {
  key: string;
  flowerId: string;
  angle: number;
  reach: number;
  depth: number;
  scale: number;
  faceX: number;
  faceRot: number;
  side: number;
  variant: number;
}

/**
 * 位置ひとつぶんの下ごしらえ。attractor（結束点から見た目安位置）を
 * 中心に、揺れを乗せて実際の角度・伸びへ変える。
 */
function place(
  attractor: Attractor,
  seed: number,
  jitter: number,
  angleSpread: number,
  reachSpread: number,
  mirror: 1 | -1,
): { angle: number; reach: number } {
  const r1 = rand(seed * 3.1 + 11);
  const r2 = rand(seed * 7.7 + 23);
  // 端まで振り切っても、結び目から見て斜め60度ほどまで。
  // それ以上倒すと、束からこぼれ落ちた枝に見える。
  const angle = Math.max(
    -60,
    Math.min(60, attractor.angle * mirror + (r1 - 0.5) * angleSpread * jitter),
  );
  const reach = Math.max(0.08, attractor.reach + (r2 - 0.5) * reachSpread * jitter);
  return { angle, reach };
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

  /*
   * 「自然に広がる」だけ、束ごとに左右を反転させる。骨格
   * （coreAttractors/edgeAttractors）そのものは固定でも、毎回
   * 同じ側に偏っては単調なので、選んだ花の組み合わせから決まる
   * 一定のコイン投げで左右を決める（→ styles.ts）。左右対称な
   * round・tall では、反転しても見た目は変わらない。
   */
  const mirror: 1 | -1 = rand(stemsHash(stems) * 0.913 + 17) < 0.5 ? -1 : 1;
  const jitter = 0.55 + style.scatter * 0.85;

  const raw: RawStem[] = [];
  let keySeed = 0;

  const mainStems = stems.filter((s) => flowerById(s.flowerId).role === 'main');
  const gapStems = stems.filter((s) => {
    const role = flowerById(s.flowerId).role;
    return role === 'sub' || role === 'filler';
  });
  const greenStems = stems.filter((s) => flowerById(s.flowerId).role === 'green');

  const core = style.coreAttractors;
  const edge = style.edgeAttractors;

  /*
   * ── 主役（core）：面を作る ──────────────────────────────
   *
   * 選んだ主役を、核になる位置へ順に収める。位置より主役が多ければ
   * 隣の位置と分け合い、少なければ余った位置にも同じ花の複製が
   * 広がる ── どちらの場合も、位置の並びそのもの（＝輪郭）は
   * 崩れない。
   */
  mainStems.forEach((stem, mi) => {
    const flower = flowerById(stem.flowerId);
    const isBulky = BULKY_FLOWERS.has(flower.id);
    const variantCount = FLOWER_VARIANT_COUNT[flower.id] ?? 1;
    const variantOffset = Math.floor(rand(mi * 71.9 + 31) * variantCount);
    const wantedCount = Math.max(1, Math.round(COPIES.main * shrink));
    const count = isBulky ? Math.min(2, wantedCount) : wantedCount;

    for (let c = 0; c < count; c += 1) {
      keySeed += 1;
      const seed = mi * 97 + c * 7 + 1;
      const attractor = core[(mi + c) % core.length];
      const isPrimary = c === 0;
      const { angle, reach } = place(attractor, seed, jitter, 13, 0.08, mirror);

      const r4 = rand(seed * 5.3 + 53);
      const r6 = rand(seed * 23.1 + 83);
      const r7 = rand(seed * 37.9 + 101);

      // 主役はほぼ正面。奥行きで重ねても顔が分かるよう、詰めは控えめ。
      const turn = Math.max(0, Math.min(1, r4 * 0.4 - 0.05));
      const faceX = 1 - turn * 0.46;
      const faceRot = (r4 - 0.5) * 8 + (r6 - 0.5) * 8 * jitter;

      // 1本目＝面の顔。前寄りで、はっきり大きく。
      // 2本目以降＝同じ花がもう少し入っている気配。奥へ沈め、控えめに。
      const depthBase = isPrimary ? 0.78 : 0.42;
      const depth = Math.min(1, Math.max(0, depthBase + (rand(seed * 9.1 + 5) - 0.5) * 0.16));
      const scaleMul = isPrimary || !isBulky ? 1 : 0.74;

      const scale =
        (0.84 + depth * 0.26) *
        flower.stature *
        ROLE_SCALE.main *
        scaleMul *
        (0.95 + r7 * 0.10);

      raw.push({
        key: `${stem.uid}-${keySeed}`,
        flowerId: stem.flowerId,
        angle,
        reach,
        depth,
        scale,
        faceX,
        faceRot,
        side: Math.max(-1, Math.min(1, angle / 45)),
        variant: (c + variantOffset) % variantCount,
      });
    }
  });

  /*
   * ── 寄り添う花・小花（gap）：主役の隙間を埋める ──────────────
   *
   * 隣り合う2つの核の位置を選び、そのあいだ（t=0.3〜0.7）へ
   * 収める。核の伸びよりわずかに手前・控えめにして、主役の隙間から
   * 「覗いている」形にする。
   */
  gapStems.forEach((stem, gi) => {
    const flower = flowerById(stem.flowerId);
    const variantCount = FLOWER_VARIANT_COUNT[flower.id] ?? 1;
    const variantOffset = Math.floor(rand(gi * 61.7 + 41) * variantCount);
    const count = Math.max(1, Math.round(COPIES[flower.role] * shrink));
    /*
     * どの隙間に収まるかは、選んだ順（gi）ではなく種ごとの乱数で
     * 決める。選ぶ順で決めていたときは、選んだ花の数が少ないと
     * 毎回 core[0] 寄りの同じ隙間ばかりに偏っていた。
     */
    const speciesOffset = Math.floor(rand(gi * 83.7 + 13) * core.length);

    for (let c = 0; c < count; c += 1) {
      keySeed += 1;
      const seed = 500 + gi * 97 + c * 7;
      const aIdx = (speciesOffset + c) % core.length;
      const bIdx = (aIdx + 1) % core.length;
      const a = core[aIdx];
      const b = core[bIdx];
      const t = 0.32 + rand(seed * 4.4 + 2) * 0.36;
      const blended: Attractor = {
        angle: a.angle + (b.angle - a.angle) * t,
        // 隣り合う主役より、わずかに手前に短く。隙間から覗く高さ。
        reach: (a.reach + (b.reach - a.reach) * t) * 0.88,
      };
      const isPrimary = c === 0;
      const { angle, reach } = place(blended, seed, jitter, 16, 0.12, mirror);

      const r4 = rand(seed * 5.3 + 53);
      const r6 = rand(seed * 23.1 + 83);
      const r7 = rand(seed * 37.9 + 101);

      const turn = Math.max(0, Math.min(1, 0.15 + r4 * 0.65));
      const faceX = 1 - turn * 0.46;
      const faceRot = (r4 - 0.5) * 9 + (r6 - 0.5) * 10 * jitter;

      // 1本目だけ「そこにいる」と分かる程度に前へ。残りは主役の陰へ。
      const depthBase = isPrimary ? 0.56 : 0.22;
      const depth = Math.min(1, Math.max(0, depthBase + (rand(seed * 9.1 + 5) - 0.5) * 0.18));

      const scale =
        (0.84 + depth * 0.26) * flower.stature * ROLE_SCALE[flower.role] * (0.95 + r7 * 0.10);

      raw.push({
        key: `${stem.uid}-${keySeed}`,
        flowerId: stem.flowerId,
        angle,
        reach,
        depth,
        scale,
        faceX,
        faceRot,
        side: Math.max(-1, Math.min(1, angle / 45)),
        variant: (c + variantOffset) % variantCount,
      });
    }
  });

  /*
   * ── 葉物・ライン（edge）：外へ抜けて輪郭を作る ──────────────
   *
   * 1本目は、外へ抜ける位置（edgeAttractors）へ実際に配って
   * 輪郭のふちを見せる。2本目以降は根もとの葉として奥へ沈め、
   * 「抜ける枝が何本も同じ場所から飛び出す」ことを避ける。
   */
  greenStems.forEach((stem, gi) => {
    const flower = flowerById(stem.flowerId);
    const variantCount = FLOWER_VARIANT_COUNT[flower.id] ?? 1;
    const variantOffset = Math.floor(rand(gi * 53.3 + 21) * variantCount);
    const count = Math.max(1, Math.round(COPIES.green * shrink));
    /*
     * どちらへ抜けるかも、選んだ順ではなく種ごとの乱数で決める。
     * 葉物を1種類だけ選んだときに、選んだ順（常に0番目）で決めると
     * 毎回 edge[0] にしか抜けず、「自然に広がる」の不規則な輪郭
     * （edgeAttractors に用意した複数の抜け先）が生きなかった。
     */
    const speciesEdgeOffset = edge.length > 0 ? Math.floor(rand(gi * 67.1 + 29) * edge.length) : 0;

    for (let c = 0; c < count; c += 1) {
      keySeed += 1;
      const seed = 900 + gi * 97 + c * 7;
      const isPrimary = c === 0;
      let angle: number;
      let reach: number;
      if (isPrimary || edge.length === 0) {
        const attractor =
          edge.length > 0 ? edge[(speciesEdgeOffset + c) % edge.length] : { angle: 0, reach: 0.4 };
        ({ angle, reach } = place(attractor, seed, jitter, 10, 0.10, mirror));
      } else {
        // 抜けなかった葉ものは、根もとを埋める葉として低く沈める。
        const nearRoot: Attractor = {
          angle: edge[(speciesEdgeOffset + c) % edge.length].angle * 0.3,
          reach: 0.22,
        };
        ({ angle, reach } = place(nearRoot, seed, jitter, 14, 0.14, mirror));
      }

      const r4 = rand(seed * 5.3 + 53);
      const r6 = rand(seed * 23.1 + 83);
      const r7 = rand(seed * 37.9 + 101);

      const turn = Math.max(0, Math.min(1, 0.35 + r4 * 0.6));
      const faceX = 1 - turn * 0.46;
      const faceRot = (r4 - 0.5) * 9 + (r6 - 0.5) * 10 * jitter;

      const depthBase = isPrimary ? 0.62 : 0.16;
      const depth = Math.min(1, Math.max(0, depthBase + (rand(seed * 9.1 + 5) - 0.5) * 0.18));

      let scale =
        (0.84 + depth * 0.26) * flower.stature * ROLE_SCALE.green * (0.95 + r7 * 0.10);
      if (!isPrimary) scale *= 0.84;

      raw.push({
        key: `${stem.uid}-${keySeed}`,
        flowerId: stem.flowerId,
        angle,
        reach,
        depth,
        scale,
        faceX,
        faceRot,
        side: Math.max(-1, Math.min(1, angle / 45)),
        variant: (c + variantOffset) % variantCount,
      });
    }
  });

  // 奥から順に描く。
  return raw.sort((a, b) => a.depth - b.depth);
}

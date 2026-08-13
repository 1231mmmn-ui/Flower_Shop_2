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
 *       → 花ごとに前列・中列・奥列へ必ず分ける（band）
 *   二．アジサイのような面の大きな花が、他の主役と同じ扱いで
 *       外側へ飛ばされ、コラージュの「貼り紙」に見えた
 *       → 中心寄りへ引き戻すだけでは、「左＝アジサイ／右＝バラ」の
 *       ような**塊どうしのブロック**が残った。面の大きな花は、
 *       近くの主役（アンカー）の位置に**乗せる**ことにした
 *       ── 1本は少し奥へ沈めて主役に被らせ、もう1本は少し手前で
 *       主役の下からのぞかせる。二種類が同じ場所を取り合うことで、
 *       初めて「一緒に束ねた」ように見える。
 *   三．ユーカリが役割だけで散らされるので、左右どちらへも均等に
 *       出てしまい、対称な羽根に見えた
 *       → 束ひとつにつき片側だけへ抜ける「補外」役を用意
 *   四．外へ抜ける役をユーカリ一本だけに頼ると、「広がり＝枝が1本
 *       飛んでいるだけ」に見える。寄り添う花・小花にも、抜ける役の
 *       ごく弱い版を持たせ、広がりを束全体で少しずつ作る。
 *   五．主役はほぼ正面しか向かず、重なっても奥行きが出なかった
 *   六．`style.scatter`（一本ずつのばらつき）を定義だけして、
 *       実際の計算では一度も使っていなかった
 *
 * ここから先は、「花ごとに前列・中列・奥列へ必ず分ける」
 * 「面の大きな花は主役に乗せる」「抜ける役は片側だけ、複数の花に
 * 薄く配る」「主役にも向きのばらつきを持たせる」という**意図的な
 * 帯**を先に決め、乱数はその帯の中だけで小さく揺らす役に回しました。
 *
 * ── 数えるものと、描くものを分ける ──────────────────────
 *
 *   `bouquet.stems`   取った花。値段・記録・お客さまの受け取り方は、こちら
 *   `bunch()` の返り値 描く花。同じ花を何本かに増やして、束にする
 *
 * 増やしても値段は上がりません。**束は、本数を数えるものではありません。**
 */

import { flowerById, FLOWER_VARIANT_COUNT, type FlowerRole } from '../data/flowers';
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
 * 役割ごとの、見た目の大きさの重み。
 *
 * ── 「全部同じ面積」に見えていた理由 ────────────────────────
 *
 * 大きさは depth（手前ほど大きい）と stature（花ごとの背丈）だけで
 * 決まっていて、role は一度も参照していなかった。主役も脇役も、
 * 同じ奥行きに落ちれば同じ大きさだった。バラやダリアが「自然に主役」
 * に見えるためには、奥行きや配置だけでなく、大きさそのものに
 * 主役・脇役の重みを持たせる必要がある。かすみ草・スターチス・
 * ソリダゴのような「隙間から見える脇役」は、ここで初めて小さくなる。
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
 * 面積がずっと広いので、他の主役とまったく同じ扱いで外側へ飛ばすと、
 * 花束の縁に「貼り紙」を置いたように見えます。ただ中心へ引き戻す
 * だけでは、「面の大きな花のかたまり」と「他の主役のかたまり」が
 * 別々の場所にできるだけでした。ここでは一歩進めて、近くにある
 * 主役（アンカー）と**同じ場所を取り合わせ**、前後にずらして
 * 被らせます（→ `snapBulkyToAnchor`）。
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

interface Copy {
  stem: BouquetStem;
  outward: number;
  seed: number;
  /** 選んだ花（stems配列）の中で、何番目の種類か。抜ける方向を種ごとに決めるのに使う。 */
  speciesIndex: number;
  /** 同じ花の中で、何本目の複製か（0始まり）。 */
  copyIndex: number;
  isGreen: boolean;
  isBulky: boolean;
  /** 0＝手前列、1＝中列、2＝奥列。同じ花のコピーは必ず別の列に落ちる。 */
  band: 0 | 1 | 2;
  /** どの別角度素材を使うか（→ DrawnStem.variant）。 */
  variant: number;
}

/** 位置がまだ動く途中の状態。side・ring を確定させてから角度や伸びへ変換する。 */
interface Placement {
  copy: Copy;
  side: number;
  ring: number;
  /** 外周へ抜ける役（ユーカリの補外、寄り添う花のごく弱い版）かどうか。 */
  isEscape: boolean;
  /**
   * 大きさの追加係数（既定1）。面の大きな花の2本目以降を控えめにして、
   * 「同じ花が並んで巨大化する」のを防ぐ（→ snapBulkyToAnchor）。
   */
  scaleMul: number;
}

/** 手前・中間・奥の、奥行き（ring）の目安。乱数はこの中だけで揺れる。 */
const BAND_RING: [number, number, number] = [0.14, 0.40, 0.66];

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
    const isBulky = BULKY_FLOWERS.has(flower.id);
    /*
     * ── 面の大きな花は、そもそも複製を減らす ────────────────
     *
     * アジサイのような塊の花は、主役と同じ本数（3本）を描くと、
     * 3つとも大きく見せようとして「巨大なアジサイが3つ横に並ぶ」
     * ようになり、一つの束というより見本市になる。近くの主役に
     * 乗せて前後にずらす仕組み（→ snapBulkyToAnchor）はあくまで
     * 「もう1本、そこにも入っている」と伝える程度でよく、本数
     * そのものを絞ったほうが「大きな塊が1つ、控えめな添えが1〜2本」
     * という実際の生け方に近づく。
     */
    const count = isBulky
      ? Math.max(1, Math.min(2, Math.round(wanted[index] * shrink)))
      : Math.max(1, Math.round(wanted[index] * shrink));
    // 同じ花の中で、列（手前/中/奥）を回す順番を花ごとにずらす。
    // 全種類が同じ順（前→中→奥）だと、束全体が層になって
    // 「同じ高さの輪が3つ重なった」ように見えてしまう。
    const bandOffset = Math.floor(rand(index * 53.1 + 7) * 3);
    /*
     * 別角度素材があれば、その本数ぶんを花ごとにずらして回す。
     * 同じずらし方だと、「バラを2種類選んだ」ときに両方とも
     * 1本目＝基準、2本目＝variant1…と同じ並びになり、また
     * コピーどうしがそろって見えてしまう。花ごとの offset で崩す。
     */
    const variantCount = FLOWER_VARIANT_COUNT[flower.id] ?? 1;
    const variantOffset = Math.floor(rand(index * 71.9 + 31) * variantCount);
    for (let c = 0; c < count; c += 1) {
      /*
       * ── 「この花、入ってる？」に答えるための、一本目の保証 ──────
       *
       * 選んだ花が全種、少なくとも一輪は分かる程度に見えること
       * （→ ①の要望）。band のずらしをそのまま使うと、種によっては
       * 一本目からいきなり奥列（band=2）に落ち、その種だけ束の中で
       * 見えにくくなることがあった。**1本目（copyIndex 0）だけは
       * 必ず手前列（band=0）に固定**する。2本目以降は通常どおり
       * 3列ぶん回し、同じ花の複製どうしの奥行きにもばらつきを持たせる
       * （→ ③「同じ画像を並べた」印象への対応）。
       */
      const band = (c === 0 ? 0 : (c + bandOffset) % 3) as 0 | 1 | 2;
      copies.push({
        stem,
        outward,
        seed: index * 97 + c * 7 + 1,
        speciesIndex: index,
        copyIndex: c,
        isGreen: flower.role === 'green',
        isBulky,
        band,
        variant: (c + variantOffset) % variantCount,
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
   * ── 抜ける方向は、種類ごとに決めます ────────────────────
   *
   * 前は束ひとつにつき片方向だけに決めていて、確かに左右対称の
   * 「羽根」ではなくなったものの、「自然に広がる」でも結局
   * 束全体がまるごと同じ側へ傾くだけになり、「左右に不規則な
   * 抜けがある」という摘んできたような無造作さは出なかった。
   * 種類（speciesIndex）ごとに別々の乱数で方向を決め、同じ種の
   * 複製どうしは同じ側（枝ぶりとして自然）、種が違えば逆側にも
   * 抜けうるようにする。
   */
  const escapeSignOf = (speciesIndex: number): 1 | -1 =>
    rand(speciesIndex * 41.3 + 5.9) < 0.5 ? -1 : 1;

  /*
   * ── 束全体の、ごく弱い片寄り ────────────────────────────
   *
   * 「丸くやわらかい」「高さを出してすっきり」は左右対称のまま
   * でいい。「自然に広がる」だけは、種ごとの不規則な抜け
   * （escapeSignOf）に加えて、束全体にもごく弱い傾きを重ね、
   * 「なんとなく右のほうが賑やか」程度の下地を作る
   * （→ styles.ts の asymmetry）。
   */
  const globalLean = rand(order.length * 3.7 + 9.1) < 0.5 ? -1 : 1;
  const asymmetryBias = globalLean * style.asymmetry;

  // 一本ずつのばらつき。style.scatter を実際に効かせる。
  const jitter = 0.55 + style.scatter * 0.85;

  // ── 第一段：花ごとの帯（band）から、仮の居場所を決めます ──────
  const placements: Placement[] = order.map((copy, i) => {
    const { outward, seed, copyIndex, isGreen, isBulky, band } = copy;
    const r1 = rand(seed * 3.1 + 11);
    const r2 = rand(seed * 7.7 + 23);

    const spanCenter = order.length <= 1 ? 0 : (i / (order.length - 1)) * 2 - 1;

    // 主役は、外へ振れる幅そのものを抑える。花の顔どうしが
    // 重なって見えることを、扇に開くことより優先するため。
    const roleSpreadFactor = outward === 0 ? style.mainSpreadFactor : 1;

    let side = Math.max(
      -1,
      Math.min(
        1,
        spanCenter * 0.55 * roleSpreadFactor +
          (r1 - 0.5) * (0.9 + outward * 0.5) * roleSpreadFactor +
          // 主役は中心に近く残し、外側へ出る役ほど片寄りを強く受ける。
          asymmetryBias * (0.35 + outward * 0.65),
      ),
    );

    let ring = Math.min(1, Math.max(0, BAND_RING[band] + (r2 - 0.5) * 0.16 * jitter + outward * 0.08));

    // 主役どうしも、奥列・中列に落ちたぶんは少し沈める。
    // 全員が同じ高さで手前に並ぶと、葉が同じ帯に集まって
    // 「緑の壁」になる（→ styles.ts の paper 高さと合わせて対応）。
    if (outward === 0 && !isBulky && band !== 0) ring = Math.min(1, ring + 0.05);

    /*
     * 主役自身の顔にも、個体差を持たせる（→ styles.ts の
     * mainDriftX/mainDriftY）。ここを動かさないと、「外周へ抜ける役
     * （ユーカリ等）だけが動き、主役はいつも帯の中心にきれいに積む」
     * 形から抜けられず、「自然に広がる」でも主役の顔そのものは
     * 中心に残ってしまう。左右（X）と高さ（Y）は別の値で動かす
     * （→ 「高さを出してすっきり」で横に太らないように）。
     */
    if (outward === 0 && !isBulky) {
      const d1 = rand(seed * 29.3 + 83);
      const d2 = rand(seed * 31.7 + 97);
      side = Math.max(-1, Math.min(1, side + (d1 - 0.5) * 0.6 * style.mainDriftX));
      ring = Math.min(1, Math.max(0, ring + (d2 - 0.5) * 0.32 * style.mainDriftY));
    }

    // 面の大きな花は、いったん中心寄りへ。最終位置は後で
    // 近くの主役に乗せ直す（→ snapBulkyToAnchor）。
    if (isBulky) side *= 0.62;

    /*
     * 外周へ抜ける役。ユーカリ（outward=1.0）がいちばん強く、
     * 寄り添う花・小花（outward が低いほど）はごく弱く抜けます。
     * 「広がり＝ユーカリ一本だけ」にならないよう、束全体で
     * 少しずつ分担させます。主役（outward=0）と面の大きな花は
     * 参加しません（顔が縁へ逃げると輪郭が崩れるため）。
     */
    let isEscape = false;
    if (outward > 0 && !isBulky) {
      const escapeSign = escapeSignOf(copy.speciesIndex);
      if (copyIndex === 0) {
        isEscape = true;
        const amount = style.peripheralEscape * outward;
        /*
         * ── 方向を種ごとに分けたら、束の外接矩形が膨らみました ────
         *
         * 前は束ひとつにつき片方向だけだったので、抜ける本が
         * 反対側にはみ出すことはなかった。種ごとに向きを変えると、
         * 左右両方に同時に抜ける本ができうる。固定の下地（0.30〜0.50）
         * を style.peripheralEscape に関わらず持たせていたままだと、
         * 丸くやわらかい（低い peripheralEscape）でも実質は強く
         * 外へ抜け、必要な横幅が両側で二倍近くになり、
         * useAutoFitScale が想定以上に縮めてしまっていた。下地を
         * 下げ、外へ出る量そのものを peripheralEscape に強く従わせる。
         */
        side = escapeSign * (0.14 + r1 * 0.12 + amount * 0.58);
        ring = Math.min(1, 0.16 + r2 * 0.22);
      } else if (isGreen) {
        // 抜けなかった葉ものは、根もとを埋める葉として奥へ沈め、
        // 左右対称の羽根にしない。同じ種の抜ける本と同じ側へ、
        // ごく軽く寄せる。
        side = side * 0.4 + escapeSign * 0.08;
        ring = Math.min(1, 0.6 + r2 * 0.3);
      }
    }

    return { copy, side, ring, isEscape, scaleMul: 1 };
  });

  /*
   * ── 第二段：面の大きな花を、近くの主役に乗せます ────────────
   *
   * 中心寄りへ引き戻すだけでは、「面の大きな花のかたまり」と
   * 「他の主役のかたまり」が別々の場所にできるだけでした
   * （左右のどちらかへ寄っただけで、块そのものは残る）。
   * ここでは面の大きな花を、実在する主役（アンカー）の
   * side に重ね、ring だけを前後にずらします。
   *
   *   1本目  アンカーより少し奥へ沈め、主役を手前に被せる
   *   2本目  アンカーより少し手前で、主役の下からのぞかせる
   *   3本目以降  アンカーのすぐそばに軽くばらけさせる
   *
   * 同じ場所を取り合ってはじめて、「アジサイの塊＋バラの塊」ではなく
   * 「アジサイとバラを一緒に束ねた」ように見えます。
   */
  const anchors = placements.filter((p) => p.copy.outward === 0 && !p.copy.isBulky);
  let bulkyCounter = 0;
  for (const placement of placements) {
    if (!placement.copy.isBulky || anchors.length === 0) continue;
    const anchor = anchors[bulkyCounter % anchors.length];
    const isPrimary = placement.copy.copyIndex === 0;
    bulkyCounter += 1;
    const r1 = rand(placement.copy.seed * 19.7 + 71);
    placement.side = anchor.side + (r1 - 0.5) * 0.18;
    if (isPrimary) {
      // 1本目＝主役の下から、少し手前でのぞかせる。塊の顔として見せる本。
      placement.ring = Math.max(0, anchor.ring - 0.12 - r1 * 0.05);
    } else {
      /*
       * 2本目以降は「もう1本入っている」ことだけ伝わればよい
       * （→ ③の要望「6本を全部大きく見せる必要はない」）。
       * 主役よりさらに奥へ沈め、大きさそのものも控えめにする。
       */
      placement.ring = Math.min(1, anchor.ring + 0.20 + r1 * 0.08);
      placement.scaleMul = 0.74;
    }
  }

  // ── 第三段：確定した side・ring から、実際に描く値を作ります ────
  const drawn: DrawnStem[] = placements.map(({ copy, side, ring, isEscape, scaleMul }, i) => {
    const { stem, seed, isGreen, variant } = copy;
    const flower = flowerById(stem.flowerId);
    const r2 = rand(seed * 7.7 + 23);
    const r3 = rand(seed * 11.3 + 37);
    const r4 = rand(seed * 5.3 + 53);
    const r5 = rand(seed * 17.9 + 61);
    // 同じ花を何本描いても「同じ絵を並べた」ように見えないための、
    // 各コピー固有の小さな揺れ（→ ③）。style.scatter に左右されない
    // 一定の下地として効かせる。
    const r6 = rand(seed * 23.1 + 83);
    const r7 = rand(seed * 37.9 + 101);

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
      /*
       * 同じ角度の花を、少しずつ沈める。これが重なりを作る。
       *
       * ── 「一輪素材を並べた」感じが残っていた ────────────
       *
       * 0.20 では、band（前列/中列/奥列）で分けた奥行きの差の
       * ほうが勝ってしまい、同じ帯の中の花はほぼ同じ高さに並んで
       * 「独立して立っている」ように見えた。ここを広げ、同じ帯の
       * 中でも高さがかなり重なり合う・すれ違うようにする。
       */
      (r2 - 0.5) * 0.26 * jitter -
      Math.abs(side) * 0.10 +
      /*
       * 花の種類ごとの、自然な背丈（→ flower.stature）。
       * これまで stature は大きさ（scale）にしか効いておらず、
       * 高さ（reach）はすべての花で同じ式だった。ムスカリのような
       * 背の低い花も、ユーカリ・デルフィニウムのような背の高い花も
       * 同じ高さに並び、「高低差」が奥行き（band/ring）だけに頼って
       * いた。ここで背丈そのものを高さへ映す。
       */
      (flower.stature - 1) * 0.32;

    if (isEscape) reach += (0.05 + r5 * 0.05) * (0.5 + style.peripheralEscape);

    // 手前ほど大きく、はっきり。奥は小さく、沈む。
    const depth = Math.min(1, Math.max(0, 1 - ring * 0.95 - (r2 - 0.5) * 0.2));

    /*
     * ── 向き。正面・半身・横向きを混ぜます ────────────────
     *
     * 同じ一枚の絵しか無いので、**横幅だけを詰めて**回って見せます。
     * 主役でも、いつも正面のままだと重なりに奥行きが出ないので、
     * 役割に関わらず一定の幅で回転させます。詰めすぎると花の輪郭が
     * 壊れるので、下限は 0.5 まで。
     */
    const turn = Math.max(0, Math.min(1, copy.outward * 0.35 + r4 * 0.75 - 0.12));
    const faceX = 1 - turn * 0.46;
    /*
     * 傾きは、style.scatter（jitter）にだけ頼ると、丸くやわらかい・
     * 高さを出してすっきりのような scatter の低いスタイルでは
     * ほとんど傾かず、同じ花の複製が「向きまでそろった複製」に
     * 見えていた（→ ③）。スタイルに関わらず効く一定の下地（r6）を
     * 足し、jitter 側はそこに上乗せする分だけにする。
     */
    const faceRot = (r4 - 0.5) * 9 * (0.4 + turn) + (r6 - 0.5) * 10 * jitter;

    /*
     * ── 前後の差を広げすぎると、逆に小さく見えていました ────────
     *
     * depth の効き目を大きく広げたところ、束全体の外接矩形が
     * 膨らみ、useAutoFitScale の縮小がそのぶん強くかかって、
     * 「密にしたのに画面上ではむしろ小さい」結果になった。前後の
     * 差そのものは据え置きに近い幅へ戻し、個体差（r7）も控えめにする。
     */
    let scale =
      (0.82 + depth * 0.30) *
      flower.stature *
      ROLE_SCALE[flower.role] *
      scaleMul *
      // 同じ花の複製ごとに、大きさそのものにも小さな個体差を持たせる。
      (0.95 + r7 * 0.10) *
      0.95;
    // 根もとを埋める葉は、主張しすぎないよう少し小さく。
    if (isGreen && !isEscape) scale *= 0.84;

    return {
      key: `${stem.uid}-${i}`,
      flowerId: stem.flowerId,
      angle,
      reach,
      depth,
      scale,
      faceX,
      faceRot,
      side,
      variant,
    };
  });

  // 奥から順に描く。
  return drawn.sort((a, b) => a.depth - b.depth);
}

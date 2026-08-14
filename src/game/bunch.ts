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
  green: 0.74,
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

/**
 * 縦のラインを添えるだけの花。
 *
 * リンドウのような、丈の長い穂状の花は、脇役（role: sub）でも
 * 主張が強く、主役より目立ってしまうことがある（→ ピンポンマム＋
 * リンドウで、リンドウが主役に見えた）。ピンポンマムを大きくする
 * のではなく、リンドウ側の重みを絞る。sub・fillerすべてを弱くすると
 * 他の組み合わせ（バラ＋かすみ草など、うまくいっている束）まで
 * 変わってしまうので、この花だけの個別調整にする。
 *
 * `tallScale` を `scale` よりゆるくしているのは、tall（高さを出して
 * すっきり）では、リンドウの「縦に伸びる」性質がそのまま高さを出す
 * 役に立つため。round・naturalでは、主役の輪郭を支える添えに留める。
 */
const LINE_ACCENT: Record<string, { scale: number; tallScale: number }> = {
  gentian: { scale: 0.62, tallScale: 0.86 },
};

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
  /**
   * 一輪の絵を、まるごと見せない（→ Bouquet.css の
   * `.bouquet__stem--fragment`）。
   *
   * ── 「一輪＋一輪＋一輪」に見えていた、本当の理由 ──────────────
   *
   * 寄り添う花・小花・葉物を主役のすぐ近くへ寄せても、絵そのものは
   * 「花・葉・長い茎まで描かれた、完成した一輪」のまま丸ごと
   * 描いていた。どれだけ重ねても、輪郭の下に完成した一輪の茎や葉が
   * 透けて見え、「一輪素材を重ねた」印象が消えなかった。
   *
   * 主役（面を作る顔）は絵をまるごと見せる。寄り添う花・小花・
   * 葉物は、絵の中心（花の顔があるあたり）だけを柔らかく見せ、
   * 茎や外側の葉はマスクで透明にする。「ダリアの隙間から、
   * かすみ草の白い房がいくつか覗く」という、選んだ花が
   * **一輪まるごとではなく断片で分かる**見え方にする。
   */
  fragment: boolean;
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

/**
 * 実在する主役の位置。寄り添う花・小花（gap）が寄せる先。
 *
 * `bulky`（アジサイのような塊花）かどうかで、寄せ方そのものを変える
 * （→ 下の gapStems）。塊花は面が不透明で大きいので、他の主役と
 * 同じ「内側へ引き込む」寄せ方をすると、寄り添う花が完全に埋もれる。
 */
interface MainAnchor extends Attractor {
  bulky: boolean;
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
  fragment: boolean;
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
   * 実際に置いた主役（1本目＝顔）の位置。寄り添う花・小花は、
   * 抽象的な「核の位置の並び」ではなく、この**実在する主役**へ
   * 寄せる（→ 下の gapStems）。核の位置は5つ用意していても、
   * 選んだ主役がそのうち2つしか占めていなければ、残り3つは
   * 空き地でしかない。空き地のあいだに小花を置くと、主役の塊と
   * 小花の塊が離れて「別々の塊」に見える。
   */
  const mainAnchors: MainAnchor[] = [];

  /*
   * ── 主役（core）：面を作る ──────────────────────────────
   *
   * 選んだ主役を、核になる位置へ順に収める。位置より主役が多ければ
   * 隣の位置と分け合い、少なければ余った位置にも同じ花の複製が
   * 広がる ── どちらの場合も、位置の並びそのもの（＝輪郭）は
   * 崩れない。
   */
  /*
   * ── 同じ花を何本選んでも、ひとつの核の位置にまとめる ────────────
   *
   * `mainStems` は「取った花」を1本ずつ数えた配列で、同じ種を4本
   * 選べば4つの別エントリになる。以前はこの並び順そのままを
   * `mi`（→ core[mi % core.length]）に使っていたため、同じ種を
   * 何本も選ぶと、本数ぶんだけ**違う核の位置**へ散らばってしまった
   * （coreAttractors の間隔が広い natural で特に、同じ花が離れた
   * 場所に何個も「主役級」で並んで見えた）。ここで種ごとにまとめ、
   * 同じ種の複製はすべて**同じ核の位置**を目指すようにする。
   *
   * 塊花（アジサイ）は対象外。アジサイは複製の乗せ方（下の isBulky
   * 分岐）がすでに個別に調整済みで、1本ずつ別エントリとして扱う
   * 前提のまま検証されている。ここでまとめてしまうと、複数本選んだ
   * ときの本数・重なり方が変わってしまうので、1本＝1エントリの
   * 挙動をそのまま残す。
   */
  interface MainGroup {
    flowerId: string;
    stems: BouquetStem[];
  }
  const mainGroups: MainGroup[] = [];
  const groupedNonBulky = new Set<string>();
  mainStems.forEach((stem) => {
    const flower = flowerById(stem.flowerId);
    if (BULKY_FLOWERS.has(flower.id)) {
      mainGroups.push({ flowerId: stem.flowerId, stems: [stem] });
    } else if (!groupedNonBulky.has(stem.flowerId)) {
      groupedNonBulky.add(stem.flowerId);
      mainGroups.push({
        flowerId: stem.flowerId,
        stems: mainStems.filter((s) => s.flowerId === stem.flowerId),
      });
    }
  });
  mainGroups.forEach(({ flowerId, stems: speciesStems }, mi) => {
    const flower = flowerById(flowerId);
    const isBulky = BULKY_FLOWERS.has(flower.id);
    const variantCount = FLOWER_VARIANT_COUNT[flower.id] ?? 1;
    const variantOffset = Math.floor(rand(mi * 71.9 + 31) * variantCount);
    const wantedCount = Math.max(1, Math.round(COPIES.main * shrink * speciesStems.length));
    const count = isBulky ? Math.min(2, wantedCount) : wantedCount;

    for (let c = 0; c < count; c += 1) {
      keySeed += 1;
      const stem = speciesStems[c % speciesStems.length];
      const seed = mi * 97 + c * 7 + 1;
      const isPrimary = c === 0;
      /*
       * ── 2本目以降は、別の核の位置へ跳ばさない ────────────────
       *
       * 前は複製ごとに core[(mi+c)%length] と違う位置へ跳んでいた。
       * 選んだ主役が少ないときは全ての核が埋まって輪郭が保てる
       * 一方、「1本ごとに綺麗に離れて立つ」印象を強めてもいた。
       * ここでは同じ種の複製を**同じ核の位置のまわりに集め**、
       * 2本目以降は揺れそのものを広げて、主役どうし・同じ花どうし
       * が深く重なり合う密度を作る（→ ①の要望）。
       */
      const attractor = core[mi % core.length];
      /*
       * ── 塊花の2本目は、広げずに「同じ場所の裏」へ沈める ─────────
       *
       * 他の主役は、2本目以降の揺れを広げて重なり合う密度を作る
       * （→ ①の要望）。塊花でこれをやると、ただでさえ面積の大きい
       * 花がさらに広い範囲を覆ってしまい、寄り添う花の入る隙間が
       * 消える。塊花の2本目は揺れを狭いままにし、ほぼ同じ場所の
       * 少し奥（reach をわずかに引く）に置いて、1本目の陰に
       * 沈める複製にする。
       */
      const angleSpread = isPrimary ? 13 : isBulky ? 8 : 22;
      const reachSpread = isPrimary ? 0.08 : isBulky ? 0.04 : 0.16;
      const attractorForPlace =
        isBulky && !isPrimary ? { angle: attractor.angle, reach: attractor.reach * 0.7 } : attractor;
      const { angle, reach: rawReach } = place(
        attractorForPlace,
        seed,
        jitter,
        angleSpread,
        reachSpread,
        mirror,
      );
      /*
       * ── naturalの2本目以降は、reach を確実に一段引く ────────────
       *
       * naturalは揺れ幅（scatter）が他のスタイルよりずっと広いので、
       * 「1本目と同じ高さ・同じ大きさ」に乱数が転ぶことがあり、
       * ヒマワリやダリアで「同じ花を横に2本並べた」ペアに見えていた。
       * 角度の揺れ（naturalらしい不規則さ）はそのまま残し、reach
       * だけを毎回確実に低くして、2本目が1本目の横ではなく
       * 「少し奥・少し低い場所に咲いている」ようにする。
       */
      const isNaturalSecondary = !isPrimary && !isBulky && style.id === 'natural';
      const reach = isNaturalSecondary ? rawReach * (0.86 - c * 0.05) : rawReach;
      if (isPrimary) mainAnchors.push({ angle, reach, bulky: isBulky });

      const r4 = rand(seed * 5.3 + 53);
      const r6 = rand(seed * 23.1 + 83);
      const r7 = rand(seed * 37.9 + 101);

      // 主役はほぼ正面。奥行きで重ねても顔が分かるよう、詰めは控えめ。
      const turn = Math.max(0, Math.min(1, r4 * 0.4 - 0.05));
      const faceX = 1 - turn * 0.46;
      const faceRot = (r4 - 0.5) * 8 + (r6 - 0.5) * 8 * jitter;

      /*
       * ── 同じ花だけの束が、横並びの複製に見えていました ────────
       *
       * 2本目・3本目をひとまとめに「secondary」として同じ奥行きの
       * 帯に落としていたので、ヒマワリを3本選ぶと3本ともほぼ同じ
       * 大きさ・高さに見えた。1本ごとに段を分け、後の本ほど
       * はっきり奥へ・小さく沈める。
       */
      /*
       * ── 塊花の2本目は、かなり小さく・かなり奥へ ────────────────
       *
       * 「1本目と同じ大きさの塊がもう1つ」に見えると、寄り添う花の
       * 入る余地が消える。奥行き・大きさの両方を、ほかの主役より
       * 一段強く落とす。
       */
      const depthBase = isPrimary
        ? 0.80
        : isBulky
          ? 0.10
          : isNaturalSecondary
            ? Math.max(0.08, 0.30 - c * 0.14)
            : Math.max(0.16, 0.46 - c * 0.16);
      const depth = Math.min(1, Math.max(0, depthBase + (rand(seed * 9.1 + 5) - 0.5) * 0.14));
      const scaleMul = isPrimary ? 1 : isBulky ? 0.48 : isNaturalSecondary ? 0.74 : 1;
      // 主役の個体差も、1本目（顔）はそろえ、2本目以降で広げる。
      const scaleJitter = isPrimary ? 0.95 + r7 * 0.10 : 0.86 + r7 * 0.20;

      const scale =
        (0.84 + depth * 0.26) * flower.stature * ROLE_SCALE.main * scaleMul * scaleJitter;

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
        // 主役は「面」そのものなので、絵をまるごと見せる。
        fragment: false,
      });
    }
  });

  /*
   * ── 寄り添う花・小花（gap）：主役の輪郭へ食い込ませる ──────────
   *
   * 前は「隣り合う核の位置のあいだ」に置いていた。核の位置は
   * 選んだ主役の数だけ埋まるとは限らず、余った（誰もいない）
   * 位置のあいだに小花を置くと、主役の塊と小花の塊が離れて見えた
   * （→ アジサイ＋かすみ草のような組み合わせで特に目立った）。
   *
   * ここでは、実在する主役（mainAnchors。無ければ核の位置そのもの）
   * を直接の目当てにし、その**すぐ近く**へ強めの重なりで置く。
   * 「隙間から覗く」のではなく「主役の輪郭に一部めり込む」形にする。
   */
  const gapTargets: MainAnchor[] =
    mainAnchors.length > 0 ? mainAnchors : core.map((a) => ({ ...a, bulky: false }));
  /*
   * mainAnchors は、主役の place() ですでに mirror を適用し終えた
   * 「確定した」位置。ここでもう一度 place() に mirror を渡すと、
   * 二重に反転してしまい、寄り添う花が実在する主役の反対側へ
   * 飛んでしまう（→ アジサイ＋かすみ草で塊が分離して見えた原因）。
   * 主役が無く核の位置（未反転）を使うときだけ、mirror を効かせる。
   */
  const gapMirror: 1 | -1 = mainAnchors.length > 0 ? 1 : mirror;
  gapStems.forEach((stem, gi) => {
    const flower = flowerById(stem.flowerId);
    const variantCount = FLOWER_VARIANT_COUNT[flower.id] ?? 1;
    const variantOffset = Math.floor(rand(gi * 61.7 + 41) * variantCount);
    const count = Math.max(1, Math.round(COPIES[flower.role] * shrink));
    /*
     * どの主役に寄り添うかは、選んだ順（gi）ではなく種ごとの乱数で
     * 決める。選ぶ順で決めていたときは、選んだ花の数が少ないと
     * 毎回同じ主役ばかりに偏っていた。
     */
    const speciesOffset = Math.floor(rand(gi * 83.7 + 13) * gapTargets.length);

    for (let c = 0; c < count; c += 1) {
      keySeed += 1;
      const seed = 500 + gi * 97 + c * 7;
      const target = gapTargets[(speciesOffset + c) % gapTargets.length];
      const isPrimary = c === 0;
      const targetBulky = target.bulky;
      /*
       * ── 「主役の横に添える」ではなく「主役の内側から覗く」 ─────
       *
       * 揺れをさらに詰め、主役の位置そのものにほぼ重ねる。加えて
       * reach を少し内側（結束点寄り）へ引き、主役の花びらの
       * 陰・隙間から覗く高さにする ── 主役と同じ高さに並べると、
       * 「横に添えた」ラインになってしまう。
       *
       * ただし1本目まで強く引き込むと、主役（より高い depth・
       * 大きな scale）にほぼ完全に隠れてしまい、「選んだ花が
       * 見えなくなる」ことがあった。1本目だけは主役のすぐ縁へ
       * わずかにずらし、隙間からでも確実に顔が見える位置にする。
       * 2本目以降だけ、深く沈める。
       *
       * ── 塊花（アジサイ）が相手のときは、逆に外へ押し出す ────────
       *
       * アジサイは面そのものが不透明で大きいので、「内側へ引き込む」
       * と、寄り添う花は完全にその下へ埋もれて見えなくなる（fragment
       * マスクをかけても、その上にアジサイの塊が重なるだけ）。塊花の
       * ときだけ、角度の揺れを広げ、reach を輪郭のふち（塊花自身の
       * reach と同じか、わずかに外）まで押し出す。「内側から覗く」の
       * ではなく「輪郭のすぐ縁から顔をのぞかせる」形にする。
       */
      const angleSpread = targetBulky ? (isPrimary ? 26 : 15) : isPrimary ? 11 : 6;
      const pullIn = targetBulky ? (isPrimary ? 1.12 : 0.94) : isPrimary ? 0.97 : 0.82;
      const reachJitter = targetBulky ? 0.05 : 0.035;
      const { angle, reach: rawReach } = place(target, seed, jitter, angleSpread, reachJitter, gapMirror);
      const reach = rawReach * pullIn;

      const r4 = rand(seed * 5.3 + 53);
      const r6 = rand(seed * 23.1 + 83);
      const r7 = rand(seed * 37.9 + 101);

      const turn = Math.max(0, Math.min(1, 0.15 + r4 * 0.65));
      const faceX = 1 - turn * 0.46;
      const faceRot = (r4 - 0.5) * 9 + (r6 - 0.5) * 10 * jitter;

      /*
       * ── リンドウのような「縦のライン」は、前に出す本数を絞る ──────
       *
       * scaleを下げるだけでは、本数（COPIES.sub=4）がそのまま前へ
       * 並び、青い穂が画面の大半を占めてしまう。3本目以降は主役の
       * 陰へ深く沈め、「2〜3箇所だけ覗く添え」に留める。tallでは
       * 縦のラインがそのまま高さの役に立つので、沈め方をゆるめる。
       */
      const lineAccent = LINE_ACCENT[flower.id];
      const isLineOverflow = !!lineAccent && c >= 2;

      // 1本目だけ「そこにいる」と分かる程度に前へ。残りは主役の陰へ。
      // 塊花の縁に立つ1本目は、縁でのわずかな重なりに負けないよう
      // 塊花の1本目（depthBase 0.80）に迫る手前へ出す。
      const depthBase = targetBulky
        ? isPrimary
          ? 0.78
          : 0.22
        : isPrimary
          ? 0.56
          : isLineOverflow
            ? style.id === 'tall'
              ? 0.14
              : 0.08
            : 0.20;
      const depth = Math.min(1, Math.max(0, depthBase + (rand(seed * 9.1 + 5) - 0.5) * 0.18));

      let scale =
        (0.84 + depth * 0.26) * flower.stature * ROLE_SCALE[flower.role] * (0.95 + r7 * 0.10);
      /*
       * 1本目（isPrimary）は縮めない。主役の縁で確実に見える1本目まで
       * 縮めると、pullIn で主役の内側へ引き込まれた分と合わさって、
       * 完全に隠れてしまうことがあった（→ ピンポンマム＋リンドウの
       * naturalで、リンドウが1本も見えなくなった）。絞るのは2本目
       * 以降だけにする。
       */
      if (lineAccent && !isPrimary) scale *= style.id === 'tall' ? lineAccent.tallScale : lineAccent.scale;

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
        // 寄り添う花・小花は、絵をまるごとではなく断片で見せる。
        fragment: true,
      });
    }
  });

  /*
   * ── 葉物・ライン（edge）：外へ抜けて輪郭を作る ──────────────
   *
   * 1本目は、外へ抜ける位置（edgeAttractors）へ実際に配って
   * 輪郭のふちを見せる。
   *
   * ── 片側だけに抜けると、また「枝が飛び出した」形に戻りました ──
   *
   * 1本だけを外へ出す形は、選んだ葉物が1種類のときに特に、
   * 束全体が片側だけへ傾いた「不安定な」印象になる。実際の花束は、
   * 大きく抜ける枝が1本あっても、反対側には短い枝や小花を残して
   * 重心を支える。2本目は「長い1本」と逆側・短めの「短い添え」に、
   * 3本目以降は根もとを埋める葉として沈める。
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
    const primaryAttractor =
      edge.length > 0 ? edge[speciesEdgeOffset % edge.length] : { angle: 0, reach: 0.4 };

    for (let c = 0; c < count; c += 1) {
      keySeed += 1;
      const seed = 900 + gi * 97 + c * 7;
      const isPrimary = c === 0;
      const isCounter = c === 1 || c === 2;
      let angle: number;
      let reach: number;
      if (isPrimary) {
        ({ angle, reach } = place(primaryAttractor, seed, jitter, 10, 0.10, mirror));
      } else if (isCounter) {
        // 反対側・短めの「短い添え」。長い1本の重心を支える。
        const counterSign = c === 1 ? -1 : 1;
        const counter: Attractor = {
          angle: Math.abs(primaryAttractor.angle) * 0.5 * counterSign,
          reach: primaryAttractor.reach * 0.5,
        };
        ({ angle, reach } = place(counter, seed, jitter, 14, 0.12, mirror));
      } else {
        // 抜けなかった葉ものは、根もとを埋める葉として低く沈める。
        const nearRoot: Attractor = { angle: primaryAttractor.angle * 0.3, reach: 0.20 };
        ({ angle, reach } = place(nearRoot, seed, jitter, 14, 0.14, mirror));
      }

      const r4 = rand(seed * 5.3 + 53);
      const r6 = rand(seed * 23.1 + 83);
      const r7 = rand(seed * 37.9 + 101);

      const turn = Math.max(0, Math.min(1, 0.35 + r4 * 0.6));
      const faceX = 1 - turn * 0.46;
      const faceRot = (r4 - 0.5) * 9 + (r6 - 0.5) * 10 * jitter;

      const depthBase = isPrimary ? 0.54 : isCounter ? 0.36 : 0.14;
      const depth = Math.min(1, Math.max(0, depthBase + (rand(seed * 9.1 + 5) - 0.5) * 0.18));

      let scale =
        (0.84 + depth * 0.26) * flower.stature * ROLE_SCALE.green * (0.95 + r7 * 0.10);
      if (!isPrimary) scale *= isCounter ? 0.90 : 0.84;

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
        // 葉物・ラインも、絵をまるごとではなく断片で見せる。
        fragment: true,
      });
    }
  });

  // 奥から順に描く。
  return raw.sort((a, b) => a.depth - b.depth);
}

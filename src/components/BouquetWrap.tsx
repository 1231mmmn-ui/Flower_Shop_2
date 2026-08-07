/**
 * ブーケの包み紙とリボン。
 *
 * IMAGE_ASSETS.md §2 の通り、ブーケは「1本の花」の画像を扇状に重ねて作る。
 *
 * 包んだ姿は、**これまで CSS の多角形で描いていた。**
 * 真っ直ぐな辺（clip-path）と、等間隔の折り目（conic-gradient）と、
 * 角丸の四角を5枚並べた蝶結び ── 花と店内が水彩なのに、
 * **ここだけ図形**に見えていた。
 *
 * いまは、花や人物と同じ筆で描いた絵を読み込む。
 * 紙は6色ぶん、リボンは5色ぶん、あらかじめ書き出してある。
 */

import type { CSSProperties } from 'react';

import './BouquetWrap.css';
import { ribbonBow, wrapCone } from '../assets/paths';
import type { Ribbon, Wrapping } from '../data/wrapping';

/**
 * 包み紙。
 *
 * 絵は紙の色ごとに一枚ずつ。**ただし、太さだけは花の数で変わります。**
 * 実際のラッピングでは、束が太いほど紙が押し広げられます。
 * 絵を何枚も持たなくても、幅を変えるだけでその感じは出ます。
 *
 *   3本   幅 57%
 *   6本   幅 63%
 *   9本   幅 69%
 *
 * **束ね方でも変わります。**（→ src/game/styles.ts の `paper`）
 * 高さを出した束には細くて高い紙、広がった束には広い紙。
 * 絵は色ごとに一枚のままで、伸ばし方だけを変えています。
 */
/**
 * 紙は、二枚（絵によっては三枚）に分けて置きます。
 *
 * ── 「紙の前に花を置いた」ように見えていた理由 ────────────────
 *
 * 紙が一枚だけだと、花の**手前**に置くしかありません。
 * すると茎が結び目へ集まっていく様子が紙の裏にすべて隠れ、
 * 見えているのは「もう開いた花の頭」だけになります。
 * 束ねてある感じではなく、紙に花を並べて立てた感じになるのはこのためです。
 *
 * ── 二枚に分けても、まだ「重ねた」ように見えていた ────────────
 *
 * 奥の紙（花の後ろ）と手前の紙（根もとだけ覆う）の二層にしても、
 * **花より前に出る紙の面は、いつも同じ手前の一枚だけ**でした。
 * どの花も等しく紙の後ろにいるか、等しく紙より高いかのどちらかで、
 * 「外側の花だけ紙の折り返しの後ろに回り込む」という、包んだ束
 * ならではの入り組みが作れませんでした。
 *
 * 折り返し（山なりの絵）を描き込んだ紙では、**もう一枚**を挟みます。
 *   奥の紙（背骨。z-index いちばん低い）
 *   → 外側の花・茎（side が大きいものだけ低い z-index。折り返しの後ろへ）
 *   → 中の紙（折り返しの絵。外側の花より高く、中心の花より低い z-index）
 *   → 中心の花・茎（side が小さいものは高い z-index。折り返しの手前に出る）
 *   → 手前の紙（結び目のすぐ上、束の根もとだけを覆う。いちばん高い）
 * の五層です。中の紙より前に出る花・後ろに回る花の両方ができて
 * はじめて、「紙が花を包んでいる」感じになります
 * （z-indexの割り当ては → components/Bouquet.tsx）。
 */
export function WrapCone({
  wrapping,
  stems = 3,
  paper = { width: 1, height: 1 },
  layer,
}: {
  wrapping: Wrapping;
  stems?: number;
  /** 束ね方ごとの、紙の伸ばし方（→ src/game/styles.ts） */
  paper?: { width: number; height: number };
  /**
   * back＝花の後ろの背骨。mid＝折り返し（外側の花より前、中心の花より後ろ）。
   * front＝根もとだけを覆う、いちばん手前の一枚。
   */
  layer: 'back' | 'mid' | 'front';
}) {
  /*
   * ── 花量が増えても、紙が広がらなくなっていました ──────────
   *
   * 束ねる本数を20〜26本に増やしたのに、ここは12本で頭打ちに
   * なっていました。花のかたまりだけが大きくなり続け、紙は
   * ムスカリの小さな束のときとほぼ同じ幅のまま。上半分だけ
   * 巨大化して見えていたのはこのためです。花量にあわせて、
   * もう少し先まで紙も広がるようにします。
   */
  const spread = Math.min(20, Math.max(2, stems));
  return (
    <img
      className={`wrap-cone wrap-cone--${layer} ${wrapping.sheer ? 'wrap-cone--sheer' : ''} ${
        wrapping.hasBuiltInRibbon ? 'wrap-cone--drawn-ribbon' : ''
      }`}
      style={
        {
          '--spread': spread,
          '--paper-w': paper.width,
          '--paper-h': paper.height,
        } as CSSProperties
      }
      src={wrapCone(wrapping.id)}
      alt=""
      aria-hidden
      draggable={false}
    />
  );
}

export function RibbonBow({ ribbon }: { ribbon: Ribbon }) {
  return (
    <img
      className="bow"
      src={ribbonBow(ribbon.id)}
      alt=""
      aria-hidden
      draggable={false}
    />
  );
}

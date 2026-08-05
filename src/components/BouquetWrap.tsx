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
 * 紙は、二枚に分けて置きます。
 *
 * ── 「紙の前に花を置いた」ように見えていた理由 ────────────────
 *
 * 紙が一枚だけだと、花の**手前**に置くしかありません。
 * すると茎が結び目へ集まっていく様子が紙の裏にすべて隠れ、
 * 見えているのは「もう開いた花の頭」だけになります。
 * 束ねてある感じではなく、紙に花を並べて立てた感じになるのはこのためです。
 *
 * 本物の紙包みは逆で、**紙の中に束が入っている**ので、
 *   奥の紙（背骨として、束のうしろに見える）
 *   → 花と茎（結び目へ集まりながら、紙の上のほうに顔を出す）
 *   → 手前の紙（結び目のすぐ上、束の根もとだけを覆う）
 * の三層になります。同じ絵を二回置き、奥は花の**後ろ**（z-index を
 * 低く）、手前は根もとだけ切り出して（clip-path）花の**前**に置くと、
 * 同じ紙のまま、この三層が作れます。
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
  /** back＝花の後ろの一枚。front＝根もとだけを覆う手前の一枚。 */
  layer: 'back' | 'front';
}) {
  const spread = Math.min(12, Math.max(2, stems));
  return (
    <img
      className={`wrap-cone wrap-cone--${layer} ${wrapping.sheer ? 'wrap-cone--sheer' : ''}`}
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

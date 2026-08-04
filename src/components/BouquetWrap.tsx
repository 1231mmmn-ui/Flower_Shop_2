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
export function WrapCone({
  wrapping,
  stems = 3,
  paper = { width: 1, height: 1 },
}: {
  wrapping: Wrapping;
  stems?: number;
  /** 束ね方ごとの、紙の伸ばし方（→ src/game/styles.ts） */
  paper?: { width: number; height: number };
}) {
  const spread = Math.min(12, Math.max(2, stems));
  return (
    <img
      className={`wrap-cone ${wrapping.sheer ? 'wrap-cone--sheer' : ''}`}
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

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

import './BouquetWrap.css';
import { ribbonBow, wrapCone } from '../assets/paths';
import type { Ribbon, Wrapping } from '../data/wrapping';

export function WrapCone({ wrapping }: { wrapping: Wrapping }) {
  return (
    <img
      className={`wrap-cone ${wrapping.sheer ? 'wrap-cone--sheer' : ''}`}
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

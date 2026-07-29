/**
 * ブーケの包み紙とリボン。
 *
 * IMAGE_ASSETS.md §2 の通り、ブーケは「1本の花」の画像を扇状に重ねて作る。
 * 包んだ姿そのものの絵は素材にないので、資材の色を借りてここで描いている。
 * （assets/wrap/ の画像は、資材を選ぶ画面のほうで使う）
 */

import type { CSSProperties } from 'react';

import './BouquetWrap.css';
import type { Ribbon, Wrapping } from '../data/wrapping';

export function WrapCone({ wrapping }: { wrapping: Wrapping }) {
  return (
    <div
      className={`wrap-cone ${wrapping.sheer ? 'wrap-cone--sheer' : ''}`}
      style={
        {
          '--paper': wrapping.swatch,
          '--paper-light': wrapping.light,
          '--paper-shade': wrapping.shade,
        } as CSSProperties
      }
      aria-hidden
    >
      <span className="wrap-cone__folds" />
      <span className="wrap-cone__mouth" />
    </div>
  );
}

export function RibbonBow({ ribbon }: { ribbon: Ribbon }) {
  return (
    <div
      className="bow"
      style={
        {
          '--ribbon': ribbon.swatch,
          '--ribbon-shade': ribbon.shade,
          '--sheen': ribbon.sheen,
        } as CSSProperties
      }
      aria-hidden
    >
      <span className="bow__tail bow__tail--left" />
      <span className="bow__tail bow__tail--right" />
      <span className="bow__loop bow__loop--left" />
      <span className="bow__loop bow__loop--right" />
      <span className="bow__knot" />
    </div>
  );
}

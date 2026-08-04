/**
 * 作業台の上に立っている、一台の花。
 *
 * 値札は付けない。いま見ている花にだけ、そっと名前が出る（店頭側で出す）。
 * 手前の花は大きくはっきり、奥の花は小さくかすむ。
 */

import type { CSSProperties } from 'react';

import './FlowerStand.css';
// 棚の花は 224pt（端末で448px）。1024ではなく512で足りる（→ paths.flowerSmall）。
import { flowerSmall as flowerImage, vase } from '../assets/paths';
import type { Flower } from '../data/flowers';

interface FlowerStandProps {
  flower: Flower;
  /** いま正面にある花か */
  focused: boolean;
  /** 正面からどれだけ離れているか（0 = 正面） */
  distance: number;
  picked: number;
  onSelect: () => void;
}

/** 花瓶に生ける本数と、その傾き。 */
const STEMS = [
  { angle: -7, scale: 0.9 },
  { angle: 6, scale: 0.94 },
  { angle: -1, scale: 1.0 },
];

export function FlowerStand({
  flower,
  focused,
  distance,
  picked,
  onSelect,
}: FlowerStandProps) {
  const far = Math.min(1, distance);

  return (
    <button
      type="button"
      className={`stand ${focused ? 'is-focus' : ''}`}
      style={{ '--far': far } as CSSProperties}
      onClick={onSelect}
      aria-label={flower.name}
    >
      {/*
        ── 茎を、水の上と水の中で分けて描きます ──────────────

        「透明なコップを花の上に重ねた」ように見えていたのは、
        **水を通しても茎が何も変わらなかった**からです。
        本物のガラスと水は、通ったものをずらします。

        同じ絵を二枚置いて、水面（下から14.8%）で切り分け、
        水の中のほうだけ横へずらし、少し太く、少し淡くします。
        位置はガラスの絵から逆算しています（→ FlowerStand.css）。
      */}
      <span className="stand__flowers stand__flowers--water">
        {STEMS.map((stem, index) => (
          <img
            key={index}
            className="stand__stem"
            src={flowerImage(flower.id)}
            alt=""
            aria-hidden
            style={
              {
                '--angle': `${stem.angle}deg`,
                '--stem-scale': stem.scale,
                zIndex: index,
              } as CSSProperties
            } draggable={false} />
        ))}
      </span>

      <span className="stand__flowers stand__flowers--air">
        {STEMS.map((stem, index) => (
          <img
            key={index}
            className="stand__stem"
            src={flowerImage(flower.id)}
            alt=""
            aria-hidden
            style={
              {
                '--angle': `${stem.angle}deg`,
                '--stem-scale': stem.scale,
                zIndex: index,
              } as CSSProperties
            } draggable={false} />
        ))}
      </span>

      <img className="stand__vase" src={vase()} alt="" aria-hidden draggable={false} />
      {/* 台に触れている影。これが無いと、器が宙に浮いて見える。 */}
      <span className="stand__contact" aria-hidden />
      <span className="stand__glow" style={{ background: flower.swatch }} aria-hidden />

      {picked > 0 && (
        <span className="stand__picked" aria-label={`${picked}本 取りました`}>
          {Array.from({ length: Math.min(picked, 5) }, (_, i) => (
            <span key={i} className="stand__pick-dot" />
          ))}
        </span>
      )}
    </button>
  );
}

/**
 * 店頭の一台。花は棚ではなく、ガラスの花瓶に生けられている。
 * 手前の花は少し大きく、奥の花は少し小さく見える。
 *
 * 花瓶（assets/props/vase.png）と切り花（assets/flowers/<id>.png）は
 * 別々の素材なので、ここで重ねて「生けた状態」を作る。
 */

import type { CSSProperties } from 'react';

import './FlowerVase.css';
import { flower as flowerImage, vase } from '../assets/paths';
import { formatPrice, type Flower } from '../data/flowers';

interface FlowerVaseProps {
  flower: Flower;
  /** 0.0（奥）〜1.0（手前） */
  depth: number;
  /** 旬の花はほんの少しだけ生き生きして見える */
  inSeason: boolean;
  picked: number;
  onSelect: () => void;
}

/** 花瓶に生ける本数と、その傾き・奥行き。 */
const STEMS = [
  { angle: -8, scale: 0.92, depth: 0 },
  { angle: 7, scale: 0.95, depth: 1 },
  { angle: -1, scale: 1.0, depth: 2 },
];

export function FlowerVase({ flower, depth, inSeason, picked, onSelect }: FlowerVaseProps) {
  const scale = 0.84 + depth * 0.28;

  return (
    <button
      type="button"
      className="vase"
      style={
        {
          '--vase-scale': scale,
          '--vase-depth': depth,
        } as CSSProperties
      }
      onClick={onSelect}
      aria-label={`${flower.name}を見る`}
    >
      <span className="vase__stems">
        {STEMS.map((stem) => (
          <img
            key={stem.depth}
            className="vase__stem"
            src={flowerImage(flower.id)}
            alt=""
            aria-hidden
            style={
              {
                '--angle': `${stem.angle}deg`,
                '--stem-scale': stem.scale,
                zIndex: stem.depth,
              } as CSSProperties
            }
          />
        ))}
      </span>

      <img className="vase__glass" src={vase()} alt={`${flower.name}の花瓶`} />
      <span className="vase__glow" style={{ background: flower.swatch }} aria-hidden />

      <span className="vase__plate">
        <span className="vase__name">{flower.name}</span>
        <span className="vase__price">{formatPrice(flower.price)}／本</span>
      </span>

      {inSeason && <span className="vase__season">旬</span>}
      {picked > 0 && <span className="vase__count">{picked}</span>}
    </button>
  );
}

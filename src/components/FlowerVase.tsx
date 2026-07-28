/**
 * 店頭の一台。花は棚ではなく、ガラスの花瓶に生けられている。
 * 手前の花は少し大きく、奥の花は少し小さく見える。
 */

import './FlowerVase.css';
import { flowerVase } from '../assets/paths';
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

export function FlowerVase({ flower, depth, inSeason, picked, onSelect }: FlowerVaseProps) {
  const scale = 0.84 + depth * 0.28;

  return (
    <button
      type="button"
      className="vase"
      style={{
        // 手前ほど大きく、奥ほど淡く。自然な遠近感。
        '--vase-scale': scale,
        '--vase-depth': depth,
      } as React.CSSProperties}
      onClick={onSelect}
      aria-label={`${flower.name}を見る`}
    >
      <span className="vase__glow" style={{ background: flower.swatch }} aria-hidden />
      <img className="vase__image" src={flowerVase(flower.id)} alt={flower.name} />

      <span className="vase__plate">
        <span className="vase__name">{flower.name}</span>
        <span className="vase__price">{formatPrice(flower.price)}／本</span>
      </span>

      {inSeason && <span className="vase__season">旬</span>}
      {picked > 0 && <span className="vase__count">{picked}</span>}
    </button>
  );
}

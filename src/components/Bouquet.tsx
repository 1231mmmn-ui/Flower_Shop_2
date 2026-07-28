/**
 * ブーケ。ゲームでいちばん美しい画面になる場所。
 *
 * 花は結び目を中心に扇状に開く。素材の基準点は IMAGE_ASSETS.md の通り：
 *   切り花は「下端中央＝切り口」、包み紙は「下端付近＝結び目」、
 *   リボンは「画像の中心＝結び目」。
 */

import { useRef, type CSSProperties, type PointerEvent } from 'react';

import './Bouquet.css';
import { flowerStem, ribbon as ribbonPath, wrapping as wrappingPath } from '../assets/paths';
import { flowerById } from '../data/flowers';
import { byDepth } from '../game/arrange';
import type { Bouquet as BouquetModel } from '../game/types';

interface BouquetProps {
  bouquet: BouquetModel;
  /** 花を動かせるか */
  interactive?: boolean;
  selectedUid?: string | null;
  onSelect?: (uid: string) => void;
  onMove?: (uid: string, angle: number, reach: number) => void;
  /** 束の大きさ（親の幅に対する割合） */
  scale?: number;
  className?: string;
}

const MAX_ANGLE = 46;
const MIN_REACH = 0.24;
const MAX_REACH = 1.0;

export function Bouquet({
  bouquet,
  interactive = false,
  selectedUid = null,
  onSelect,
  onMove,
  scale = 1,
  className = '',
}: BouquetProps) {
  const knotRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<string | null>(null);

  const handlePointerDown = (uid: string) => (event: PointerEvent<HTMLDivElement>) => {
    onSelect?.(uid);
    if (!interactive) return;
    dragging.current = uid;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const uid = dragging.current;
    const knot = knotRef.current;
    if (!uid || !knot || !onMove) return;

    const box = knot.getBoundingClientRect();
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    // 真上を 0 度として、時計回りに測る
    const angle = clamp((Math.atan2(dx, -dy) * 180) / Math.PI, -MAX_ANGLE, MAX_ANGLE);
    const distance = Math.hypot(dx, dy) / (box.height * 0.62 || 1);
    onMove(uid, angle, clamp(distance, MIN_REACH, MAX_REACH));
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragging.current = null;
  };

  return (
    <div
      className={`bouquet ${interactive ? 'bouquet--live' : ''} ${className}`}
      style={{ '--bouquet-scale': scale } as CSSProperties}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div className="bouquet__knot" ref={knotRef} aria-hidden />

      {byDepth(bouquet.stems).map((stem) => {
        const flower = flowerById(stem.flowerId);
        const selected = stem.uid === selectedUid;
        return (
          <div
            key={stem.uid}
            className={`bouquet__stem ${selected ? 'is-selected' : ''}`}
            style={
              {
                '--angle': `${stem.angle + stem.sway * 0.3}deg`,
                '--reach': stem.reach,
                '--depth': stem.depth,
                '--scale': stem.scale,
                zIndex: 10 + Math.round(stem.depth * 40),
              } as CSSProperties
            }
            onPointerDown={handlePointerDown(stem.uid)}
          >
            <img src={flowerStem(flower.id)} alt={flower.name} draggable={false} />
          </div>
        );
      })}

      <img
        className="bouquet__wrap"
        src={wrappingPath(bouquet.wrappingId)}
        alt=""
        aria-hidden
      />
      <img
        className="bouquet__ribbon"
        src={ribbonPath(bouquet.ribbonId)}
        alt=""
        aria-hidden
      />
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

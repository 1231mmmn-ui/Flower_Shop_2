/**
 * ブーケ。ゲームでいちばん美しい画面になる場所。
 *
 * IMAGE_ASSETS.md §2 の通り、「1本の花」の画像を扇状に重ねて束にする。
 * 花の画像は下端中央が切り口なので、そこを軸に回す。
 * 包み紙とリボンは資材の色を借りて BouquetWrap で描く。
 */

import { useRef, type CSSProperties, type PointerEvent } from 'react';

import './Bouquet.css';
import { flower as flowerImage } from '../assets/paths';
import { RibbonBow, WrapCone } from './BouquetWrap';
import { flowerById } from '../data/flowers';
import { ribbonById, wrappingById } from '../data/wrapping';
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

/**
 * 花をつかむ場所。
 *
 * ── 触れなかった本当の理由 ─────────────────────────────
 *
 * 一本ぶんの `<div>` は、**1024×1024 の透過画像まるごと**の四角でした。
 * 見えている花はその中のごく一部で、まわりは透明です。
 * 手前の花の**透明なところ**が、奥の花にかぶさっていました。
 *
 * だから、
 *   ・押したい花が反応しない  … 手前の花の透明な部分を押していた
 *   ・隣の花を掴んでしまう    … 同上。見えている花と、当たり判定がずれていた
 * この2つは**同じ原因**でした。
 *
 * 直し方は、当たり判定を**花の頭のところだけ**にすること。
 * 画像そのものは触れなくして（pointer-events: none）、
 * 花の頭に、指のとどく大きさの丸をひとつ置きます。
 */
const GRAB_R = 26;      // つかめる丸の半径（%指定ではなく、指の大きさで決める）

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
  /**
   * 掴んだ瞬間の「指の位置」と「花の位置」のずれ。
   *
   * これが無いと、掴んだ瞬間に花が指のところへ**飛びます。**
   * 花の軸が指を向くように計算していたので、花の頭を持ったつもりでも
   * 根もとが指に来ていました。「思った位置に動かしにくい」の正体です。
   * 掴んだときのずれを覚えて、そのぶんを差し引きます。
   */
  const grip = useRef<{ angle: number; reach: number } | null>(null);

  /** 指の位置を、束の（角度・伸び）に直す。 */
  const readPointer = (event: PointerEvent<HTMLElement>) => {
    const knot = knotRef.current;
    if (!knot) return null;
    const box = knot.getBoundingClientRect();
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    return {
      // 真上を 0 度として、時計回りに測る
      angle: (Math.atan2(dx, -dy) * 180) / Math.PI,
      reach: Math.hypot(dx, dy) / (box.height * 0.62 || 1),
    };
  };

  const handlePointerDown =
    (uid: string, angle: number, reach: number) => (event: PointerEvent<HTMLElement>) => {
      onSelect?.(uid);
      if (!interactive) return;
      const at = readPointer(event);
      grip.current = at ? { angle: at.angle - angle, reach: at.reach - reach } : null;
      dragging.current = uid;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.stopPropagation();
    };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const uid = dragging.current;
    const at = readPointer(event);
    if (!uid || !at || !onMove) return;
    const off = grip.current ?? { angle: 0, reach: 0 };
    onMove(
      uid,
      clamp(at.angle - off.angle, -MAX_ANGLE, MAX_ANGLE),
      clamp(at.reach - off.reach, MIN_REACH, MAX_REACH),
    );
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragging.current = null;
    grip.current = null;
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
          >
            <img src={flowerImage(flower.id)} alt={flower.name} draggable={false} />
            {/*
              つかむところ。花の頭のあたりに、指のとどく大きさで。
              画像ではなくこれを押します（画像は pointer-events: none）。
            */}
            {interactive && (
              <button
                type="button"
                className="bouquet__grab"
                style={{ width: GRAB_R * 2, height: GRAB_R * 2 }}
                onPointerDown={handlePointerDown(stem.uid, stem.angle, stem.reach)}
                aria-label={`${flower.name}を動かす`}
              />
            )}
          </div>
        );
      })}

      <WrapCone wrapping={wrappingById(bouquet.wrappingId)} />
      <RibbonBow ribbon={ribbonById(bouquet.ribbonId)} />
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

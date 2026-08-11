/**
 * 一輪の花。花瓶は使わない。
 *
 * ── 新方針（花瓶の廃止）─────────────────────────────────────
 *
 * 「花瓶に生けてある花」ではなく、植物図鑑や絵本の1ページに
 * 一輪だけそっと描かれているような見せ方にする。だから、ここでは
 * 花の絵をそのまま出すだけで、器も水も描き足さない。
 *
 * 茎の傾き・葉の付き方・花首のかしげ方は、花ごとの絵にすでに
 * 描いてある通りのまま見せる。まっすぐに直したり、そろえたりは
 * しない ── 全部を直立させると、標本を並べたような硬さになる。
 *
 * ── 花ごとの拡大率（→ src/data/flowerBounds.ts）────────────
 *
 * キャンバスはどれも正方形であっても、絵柄がその中のどこまで
 * 届いているかは花ごとに違う。同じ倍率で並べると、余白の少ない花
 * （ユーカリ・ムスカリ等）は画面から切れやすく、余白の多い花は
 * やけに小さく見える。実測した bounding box から、花の絵柄そのもの
 * が表示エリアの中でだいたい同じ大きさに見えるよう、花ごとに
 * 拡大率と中心位置を計算する。
 */

import type { CSSProperties } from 'react';

import './SingleFlower.css';
import { flowerBoundsOf } from '../data/flowerBounds';

interface SingleFlowerProps {
  /** 絵を引く花のID（→ flowerBounds のキー）。 */
  flowerId: string;
  /** 実際に読み込む画像のパス（呼び出し側が flower()/flowerSmall() を選ぶ）。 */
  src: string;
  alt?: string;
  className?: string;
}

/** 花の絵柄が、表示エリアの短いほうの辺に対して占める割合の基準値。 */
const TARGET_FILL = 0.8;
/*
 * `presence`（→ flowerBounds.ts）で基準値を押し上げ／押し下げても、
 * 必ずここに収まるようにする。上限を1.0未満にしておけば、
 * どれだけ `presence` を大きくしても表示エリアからはみ出さない
 * （「全体＋小さな余白」を、自動フィットとは別にここでも保証する）。
 */
const MIN_FILL = 0.68;
const MAX_FILL = 0.94;

export function SingleFlower({ flowerId, src, alt = '', className = '' }: SingleFlowerProps) {
  const bounds = flowerBoundsOf(flowerId);
  const contentW = bounds.right - bounds.left;
  const contentH = bounds.bottom - bounds.top;
  const centerX = (bounds.left + bounds.right) / 2;
  const centerY = (bounds.top + bounds.bottom) / 2;
  const targetFill = Math.max(MIN_FILL, Math.min(MAX_FILL, TARGET_FILL * (bounds.presence ?? 1)));
  const fitScale = targetFill / Math.max(contentW, contentH);

  return (
    <span className={`single-flower ${className}`}>
      <img
        className="single-flower__img"
        src={src}
        alt={alt}
        aria-hidden={alt === ''}
        draggable={false}
        style={
          {
            '--content-cx': centerX,
            '--content-cy': centerY,
            '--fit-scale': fitScale,
          } as CSSProperties
        }
      />
    </span>
  );
}

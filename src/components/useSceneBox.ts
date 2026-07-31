/**
 * 店内の絵の、どこに何があるか。
 *
 * 背景は 1600×1200 の絵を cover で敷いている（.scene）。
 * 画面の縦横比によって、どこがどれだけ切り取られるかが変わるので、
 * 絵の中の座標（比）を、画面の座標（px）に直す計算をここに置く。
 *
 * これがないと、窓の外の景色を窓のところに置けない。
 */

import { useEffect, useState, type RefObject } from 'react';

/** 背景画（tools/placeholder_art/scene.py と同じ寸法） */
const SCENE_W = 1600;
const SCENE_H = 1200;

/** background-position: center 42%（global.css の .scene と合わせる） */
const POS_X = 0.5;
const POS_Y = 0.42;

/** 窓の内側。scene.py の WINDOW_BOX と同じ値。 */
export const WINDOW_BOX = { x0: 0.368, y0: 0.055, x1: 0.632, y1: 0.4 } as const;

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** 絵の中の比（0〜1）を、画面の px に直す。 */
function project(
  box: { x0: number; y0: number; x1: number; y1: number },
  viewW: number,
  viewH: number,
): Rect {
  // cover: 縦横どちらもはみ出すまで拡大する
  const scale = Math.max(viewW / SCENE_W, viewH / SCENE_H);
  const drawnW = SCENE_W * scale;
  const drawnH = SCENE_H * scale;
  // はみ出したぶんを、background-position の割合で振り分ける
  const offsetX = (viewW - drawnW) * POS_X;
  const offsetY = (viewH - drawnH) * POS_Y;

  return {
    left: offsetX + box.x0 * drawnW,
    top: offsetY + box.y0 * drawnH,
    width: (box.x1 - box.x0) * drawnW,
    height: (box.y1 - box.y0) * drawnH,
  };
}

/**
 * 窓の内側が、いま画面のどこにあるか。
 * 画面の大きさが変わったら、そのつど計算し直す。
 */
export function useWindowRect(ref: RefObject<HTMLElement | null>): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const measure = (): void => {
      const { width, height } = node.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      setRect(project(WINDOW_BOX, width, height));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return rect;
}

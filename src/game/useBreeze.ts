/**
 * 風。
 *
 * ときどき、ひと吹きだけ吹く。葉と花が、そのたびに大きく揺れる。
 *
 * 一定の間隔にしないのが肝心で、周期がそろうと機械に見える。
 * 「繰り返しに見えた瞬間、この時間は死にます」（→ design/15-build-order.md 3章）
 */

import { useEffect, useState } from 'react';

/** ひと吹きと、次のひと吹きのあいだ（ミリ秒）。 */
const GAP: readonly [number, number] = [20_000, 46_000];
/** ひと吹きが吹き抜けるまでの長さ。 */
const GUST_MS = 6_500;

const between = ([lo, hi]: readonly [number, number]): number =>
  lo + Math.random() * (hi - lo);

/**
 * いま風が吹いているかを返す。
 * 画面はこれを見て、葉と花の揺れを一段大きくするだけでよい。
 */
export function useBreeze(active = true): boolean {
  const [gusting, setGusting] = useState(false);

  useEffect(() => {
    if (!active) {
      setGusting(false);
      return;
    }

    let stopped = false;
    const timers: number[] = [];

    const schedule = (): void => {
      if (stopped) return;
      timers.push(
        window.setTimeout(() => {
          if (stopped) return;
          setGusting(true);
          timers.push(
            window.setTimeout(() => {
              if (stopped) return;
              setGusting(false);
              schedule();
            }, GUST_MS),
          );
        }, between(GAP)),
      );
    };

    // 最初のひと吹きは、入ってすぐには来ない。少し待たせる。
    schedule();

    return () => {
      stopped = true;
      for (const id of timers) window.clearTimeout(id);
    };
  }, [active]);

  return gusting;
}

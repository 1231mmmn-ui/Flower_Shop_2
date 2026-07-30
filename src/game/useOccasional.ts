/**
 * ときどき、一度だけ起きること。
 *
 * 揺れを測って分かったのは、**動かす量より、くり返さないことのほうが効く**
 * ということでした（→ design/16-stillness.md 3-2章）。
 *
 * ただし、すべての動きを直す必要はありません。ここには線があります。
 *
 *   続いている動き（埃・光の呼吸・木々の揺れ）
 *     → 一定の周期でよい。目印がないので、人はくり返しに気づけない
 *
 *   一度だけ起きること（花びらが散る・とんぼが横切る・息が白くなる）
 *     → **一定の周期にしてはいけない。**
 *        「さっきも同じ間で起きた」と分かってしまう
 *
 * CSS の infinite は、後者には使えません。この hook で置き換えます。
 */

import { useEffect, useState } from 'react';

const between = (lo: number, hi: number): number => lo + Math.random() * (hi - lo);

export interface Occasional {
  /** いま起きているか */
  active: boolean;
  /** 起きるたびに増える。key に渡すと、動きを最初からやり直せる */
  count: number;
}

/**
 * @param gap      次に起きるまでの間（ミリ秒）。この幅の中でばらつく
 * @param duration 一度の長さ（ミリ秒）
 * @param enabled  false のあいだは何も起こさない
 */
export function useOccasional(
  gap: readonly [number, number],
  duration: number,
  enabled = true,
): Occasional {
  const [state, setState] = useState<Occasional>({ active: false, count: 0 });

  useEffect(() => {
    if (!enabled) {
      setState((was) => (was.active ? { ...was, active: false } : was));
      return;
    }

    let stopped = false;
    const timers: number[] = [];

    const schedule = (): void => {
      if (stopped) return;
      timers.push(
        window.setTimeout(() => {
          if (stopped) return;
          setState((was) => ({ active: true, count: was.count + 1 }));
          timers.push(
            window.setTimeout(() => {
              if (stopped) return;
              setState((was) => ({ ...was, active: false }));
              schedule();
            }, duration),
          );
        }, between(gap[0], gap[1])),
      );
    };

    schedule();
    return () => {
      stopped = true;
      for (const id of timers) window.clearTimeout(id);
    };
  }, [gap, duration, enabled]);

  return state;
}

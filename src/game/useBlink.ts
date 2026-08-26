/**
 * お客さまの瞬き。
 *
 * 4〜7秒のあいだで不規則に間隔を選び、150msだけ閉じてまた開く。
 * 一定間隔にすると機械的な点滅に見えるため、毎回ランダムに選び直す。
 *
 * `active` が false のあいだは瞬きを止める（目を開けたまま止める）。
 * 画面がぼけている・タブが裏に回っているなど、人物が主役でない
 * 場面で瞬きが動き続けると、静かな一枚絵の中で唐突に感じられるため
 * （具体的な条件は呼び出し側が `useIdleActive` で組み立てて渡す）。
 */
import { useEffect, useState } from 'react';

const MIN_INTERVAL_MS = 4000;
const MAX_INTERVAL_MS = 7000;
const CLOSED_MS = 150;

export function useBlink(active: boolean): boolean {
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!active) {
      setClosed(false);
      return;
    }

    let openTimer: number;
    let closeTimer: number;

    const scheduleNext = () => {
      const wait = MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
      openTimer = window.setTimeout(() => {
        setClosed(true);
        closeTimer = window.setTimeout(() => {
          setClosed(false);
          scheduleNext();
        }, CLOSED_MS);
      }, wait);
    };

    scheduleNext();
    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(closeTimer);
    };
  }, [active]);

  return closed;
}

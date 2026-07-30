/**
 * 「眺める間」を、二案くらべるための道具。
 *
 *   自動版   完成の3秒後、UIがひとりでに消える
 *   手動版   プレイヤーがふれたときに、UIが消える
 *
 * どちらがこのゲームらしいかを、感覚ではなく秒数で選ぶ。
 *
 * ── 測るものを、まちがえないこと ────────────────────────────
 *
 *   主      花だけになってから、次の操作までの秒数
 *   副      画面に入ってから、出るまでの秒数
 *
 * 一度は「合計だけ見ればよい」と考えたが、それは誤りだった。
 * 手動版でUIを長く読んだだけでも合計は伸びるので、
 * 「花の余韻が良かった」という結論になってしまう。
 * だから主指標は**花だけの時間**にして、合計は裏づけに使う。
 *
 * ── そして、これは一度きりの道具 ─────────────────────────
 *
 * 滞在時間を測ることは、そのまま「滞在時間を伸ばす設計」につながる。
 * それはこのゲームがいちばん避けたいもの（→ design/16-stillness.md 5章）。
 * 案がひとつに決まったら、**この仕組みは丸ごと外す。**
 * 外したあとも困らないよう、選んだ理由だけは設計書に残す。
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/** どちらの案か。 */
export type LingerMode = 'auto' | 'manual';

/** 自動版で、UIがひとりでに消えるまで。 */
export const AUTO_HIDE_MS = 3_000;

const STORAGE_KEY = 'flower-shop-hanasaku:linger-trial';

export interface LingerRecord {
  mode: LingerMode;
  /** 主指標：花だけになってから、次の操作までの秒 */
  aloneSec: number;
  /** 副指標：画面に入ってから、出るまでの秒 */
  totalSec: number;
  at: string;
}

/** 記録を読む（結果を報告するときに使う）。 */
export function readLingerRecords(): LingerRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LingerRecord[]) : [];
  } catch {
    return [];
  }
}

/**
 * 日ごとに案を入れ替える。
 * 同じ人が両方を遊べるようにするため、片方に寄せない。
 */
export function lingerModeForDay(day: number): LingerMode {
  return day % 2 === 0 ? 'auto' : 'manual';
}

export function useLingerTrial(mode: LingerMode) {
  const [hidden, setHidden] = useState(false);
  const enteredAt = useRef(Date.now());
  const hiddenAt = useRef<number | null>(null);
  const saved = useRef(false);

  // 自動版だけ、3秒後にひとりでに消える。
  useEffect(() => {
    if (mode !== 'auto') return;
    const id = window.setTimeout(() => {
      setHidden(true);
      hiddenAt.current = Date.now();
    }, AUTO_HIDE_MS);
    return () => window.clearTimeout(id);
  }, [mode]);

  /** 手動版で、プレイヤーがUIを下げた（または戻した）。 */
  const toggle = useCallback(() => {
    setHidden((was) => {
      if (!was) hiddenAt.current = Date.now();
      else hiddenAt.current = null;
      return !was;
    });
  }, []);

  /** この画面を出るとき、二つの秒数を残す。 */
  const finish = useCallback(() => {
    if (saved.current) return;
    saved.current = true;
    const now = Date.now();
    const record: LingerRecord = {
      mode,
      aloneSec: hiddenAt.current ? (now - hiddenAt.current) / 1000 : 0,
      totalSec: (now - enteredAt.current) / 1000,
      at: new Date().toISOString(),
    };
    try {
      const all = readLingerRecords();
      all.push(record);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(-60)));
    } catch {
      /* 記録できなくても、遊びは止めない */
    }
  }, [mode]);

  return { hidden, toggle, finish };
}

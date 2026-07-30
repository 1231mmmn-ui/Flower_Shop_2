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
  /** 主指標：束だけになってから、次の操作までの秒 */
  aloneSec: number;
  /** 副指標：画面に入ってから、出るまでの秒 */
  totalSec: number;
  /**
   * 手動版で、束にふれたか。
   *
   * これが無いと、主指標が0のとき「眺めたくなかった」のか
   * 「ふれられると知らなかった」のか区別できない。
   * 前者は設計の答えだが、後者はただの分かりにくさで、別の話。
   */
  touched: boolean;
  /** その案に切り替わって最初の日か（慣れと物珍しさが乗るので、集計から外す） */
  firstOfBlock: boolean;
  day: number;
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

/** ひとつの案を続けて遊ぶ日数。 */
const BLOCK_DAYS = 4;

/**
 * 案の割り当て。
 *
 * 一日ごとに入れ替えるのをやめた。理由が二つある。
 *
 *   1. 「昨日と違う」こと自体が、体験に混ざってしまう
 *   2. **手動版の初日は、ふれられると知らないまま終わる**
 *      → 束だけの状態に一度も入らず、主指標が0になる
 *      → それは設計の答えではなく、ただの分かりにくさ
 *
 * だから4日ずつまとめて切り替え、各ブロックの初日は集計から外す。
 */
export function lingerModeForDay(day: number): LingerMode {
  return Math.floor((day - 1) / BLOCK_DAYS) % 2 === 0 ? 'auto' : 'manual';
}

/** その案に切り替わって最初の日か。 */
export function isFirstOfBlock(day: number): boolean {
  return (day - 1) % BLOCK_DAYS === 0;
}

export function useLingerTrial(mode: LingerMode, day: number) {
  const [hidden, setHidden] = useState(false);
  const enteredAt = useRef(Date.now());
  const hiddenAt = useRef<number | null>(null);
  /**
   * 束だけだった時間の合計。
   *
   * はじめは「最後に隠れた時刻」から引くだけにしていたが、それでは
   * 一度でも戻すと0になってしまう。下げて戻して、また下げる人もいる。
   * **足していく**のが正しい。
   */
  const aloneMs = useRef(0);
  const touched = useRef(false);
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

  /**
   * UIを下げる／戻す。
   *
   * **自動版でも必ず戻せること。** ここは一度、遊べなくなる穴だった。
   * 自動版では3秒後にUIが消え、そのとき下の帯は pointer-events: none に
   * なるのに、束にふれても何も起きなかった。つまり
   * **お渡しの画面から出られない。** それが4日のうち2日ぶん起きていた。
   *
   * ⓪感情設計書の【余韻】には、はじめから
   * 「UIが1.1秒かけて全部消え、ブーケと笑顔だけが残る。**ふれると戻る**」
   * と書いてある。実装がその最後の一句を落としていた。
   *
   * 「プレイヤーに応えることは、必ず応える」（→ ⑯静けさ 3章）。
   */
  const toggle = useCallback(() => {
    touched.current = true;
    setHidden((was) => {
      if (!was) {
        hiddenAt.current = Date.now();
      } else if (hiddenAt.current) {
        aloneMs.current += Date.now() - hiddenAt.current;
        hiddenAt.current = null;
      }
      return !was;
    });
  }, []);

  /** この画面を出るとき、二つの秒数を残す。 */
  const finish = useCallback(() => {
    if (saved.current) return;
    saved.current = true;
    const now = Date.now();
    const alone =
      aloneMs.current + (hiddenAt.current ? now - hiddenAt.current : 0);
    const record: LingerRecord = {
      mode,
      aloneSec: alone / 1000,
      totalSec: (now - enteredAt.current) / 1000,
      // 自動版は放っておいても束だけになるので、「ふれた」は問わない。
      touched: mode === 'auto' ? true : touched.current,
      firstOfBlock: isFirstOfBlock(day),
      day,
      at: new Date().toISOString(),
    };
    try {
      const all = readLingerRecords();
      all.push(record);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(-60)));
    } catch {
      /* 記録できなくても、遊びは止めない */
    }
  }, [mode, day]);

  return { hidden, toggle, finish };
}

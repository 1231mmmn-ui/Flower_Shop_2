/**
 * 束ね方。三つ。
 *
 * ── 一本ずつ動かす方式を、やめました ──────────────────────
 *
 * あれは「画像を配置する操作」でした。
 * うまく置けたか／置けなかったか、という話になっていて、
 * うまく置けても嬉しくなく、置けないと自分が下手に思えました。
 *
 * ここでしてほしいのは、そういうことではありません。
 *
 *   「この人には、どんな束が似合うだろう」
 *
 * と考える時間です。だから、**こちらが最後まで組んだ束を三つ出します。**
 * 三つとも成立しています。**優劣も、正解も、点数もありません。**
 * どれを選んでも、お客さまの受け取り方は変わりません（→ evaluation.ts）。
 *
 * ── 三つの違いは、何で作るか ────────────────────────────
 *
 *   丸くやわらかい   角度を広く、伸びをそろえる    → まるい輪郭
 *   高さを出してすっきり 角度を狭く、真ん中を高く   → 縦に立つ輪郭
 *   自然に広がる     角度も伸びも、一本ずつずらす  → 揺れのある輪郭
 *
 * どれも花屋が実際に組む形です。
 * 「派手な形」「珍しい形」は入れません ── 選ぶ理由が
 * 「その人に似合うか」から「見栄えがするか」へ移るので。
 */

import type { BouquetStyleId } from './types';

export interface BouquetStyle {
  id: BouquetStyleId;
  /** 選ぶときに読む名前。効果ではなく、形の話だけを書く。 */
  name: string;
  /** 一行だけ。良し悪しは言わない。 */
  note: string;
  /** 扇の広がり（度）。端の花が何度まで倒れるか。 */
  spread: number;
  /**
   * 中心の花が、どれだけ抜けて高いか。
   * 0 なら全部おなじ高さ、1 なら真ん中だけ大きく伸びる。
   */
  crown: number;
  /**
   * 外側の花が、どれだけ低く落ちるか。
   *
   * **0.2 は落としすぎでした。** 外側の花が紙の口と同じ高さに来て、
   * 紙の横から生えているように見えました。花屋の束は、
   * 外側の花も必ず紙の口より上にあります。
   */
  drop: number;
  /** 一本ずつのばらつき。0 なら整然、1 ならかなり自然。 */
  scatter: number;
  /**
   * 包み紙の広がり。束の輪郭に合わせて紙も変わる。
   * 幅と高さの倍率で、1.0 が基準。
   */
  paper: { width: number; height: number };
}

export const BOUQUET_STYLES: BouquetStyle[] = [
  {
    id: 'round',
    name: '丸くやわらかい',
    note: '花の顔がそろって、まるい輪郭になります。',
    spread: 38,
    crown: 0.18,
    drop: 0.05,
    scatter: 0.22,
    paper: { width: 1.06, height: 0.96 },
  },
  {
    id: 'tall',
    name: '高さを出してすっきり',
    note: '真ん中の花が高く立って、縦に伸びます。',
    spread: 21,
    crown: 0.52,
    drop: 0.02,
    scatter: 0.16,
    paper: { width: 0.9, height: 1.1 },
  },
  {
    id: 'natural',
    name: '自然に広がる',
    note: '一本ずつ向きが違って、摘んできたように見えます。',
    spread: 46,
    crown: 0.24,
    drop: 0.09,
    scatter: 0.72,
    paper: { width: 1.12, height: 1.0 },
  },
];

export function styleById(id: BouquetStyleId): BouquetStyle {
  return BOUQUET_STYLES.find((style) => style.id === id) ?? BOUQUET_STYLES[0];
}

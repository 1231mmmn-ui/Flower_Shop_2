/**
 * 今日、店に来てくださる方たち。
 *
 * ── なぜ一日一組をやめたか ──────────────────────────────
 *
 * 実際に遊ぶと、**一人お渡ししただけで店を閉めていました。**
 * 開けて、迎えて、渡して、閉める。花屋の一日には見えません。
 * 一日の終わりに残ってほしいのは
 *
 *   「今日は、こんなお客さまたちに花を渡したな」
 *
 * であって、「今日は一人来た」ではありません。
 *
 * ── 数 ──────────────────────────────────────────────
 *
 * 3〜5組。**毎日5組に固定しません。**
 * 固定すると、それは営業ノルマの形になります。
 * 静かな日と、少し忙しい日があるほうが、店の一日らしい。
 *
 *   一年 20日 × 平均4組 = 80組
 *   全体 40〜80分を保つには、一組あたり 30〜60秒
 *
 * **だから、一組あたりを軽くすることが同時に要ります。**
 * 花束を3つの形から選ぶようにしたのも、待ち時間を削ったのも、
 * 組数を増やすことと**ひと続きの設計**です。
 * 数だけ増やすと、このゲームでいちばん大事な
 * 「この人には、この花だ」が、作業に変わります。
 *
 * ── 誰が来るか ────────────────────────────────────────
 *
 * その日ごとに決まります（同じ日なら何度開いても同じ顔ぶれ）。
 * **プレイヤーの状態は一切見ません。**
 * 「まだ会っていない人を優先して出す」をやると、
 * 来店が名簿を埋める作業になります（→ src/data/market.ts と同じ理由）。
 */

import { CUSTOMERS } from './customers';
import type { SeasonId } from './seasons';

/** 一日に来てくださる組数の、下と上。 */
export const VISITS_MIN = 3;
export const VISITS_MAX = 5;

/** その日ごとに決まる、ぶれない乱数（market.ts と同じ式）。 */
function roll(day: number, salt: number): number {
  const x = Math.sin(day * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function hash(id: string): number {
  return id.split('').reduce((h, ch) => (h * 33 + ch.charCodeAt(0)) % 9973, 7);
}

/** 今日は何組いらっしゃるか。3〜5組。 */
export function visitsForDay(day: number): number {
  const span = VISITS_MAX - VISITS_MIN + 1;
  return VISITS_MIN + Math.floor(roll(day, 17) * span);
}

/**
 * 今日いらっしゃる方たちを、来る順に。
 *
 * `yesterday` には昨日いらした方を渡します。続けて同じ人が来ると、
 * せっかくの再会が「また来た」になるので、後ろへ回します。
 * **外しはしません** ── 昨日の人が今日も来ることは、実際にあるので。
 */
export function customersForDay(
  day: number,
  season: SeasonId,
  yesterday: string[] = [],
): string[] {
  const suited = CUSTOMERS.filter(
    (customer) => !customer.seasons || customer.seasons.includes(season),
  );
  // その日の並び。同じ日なら必ず同じ順になる。
  const shuffled = [...suited].sort(
    (a, b) => roll(day, hash(a.id)) - roll(day, hash(b.id)),
  );
  const came = new Set(yesterday);
  const ordered = [
    ...shuffled.filter((customer) => !came.has(customer.id)),
    ...shuffled.filter((customer) => came.has(customer.id)),
  ];
  return ordered.slice(0, Math.min(visitsForDay(day), ordered.length)).map((c) => c.id);
}

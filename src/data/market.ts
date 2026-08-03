/**
 * ⓪-a 市場。
 *
 * **今日いちばん美しい花に出会う場所**です。仕入れの場所ではありません。
 *
 *   置かないもの   仕入れ数・値段・原価・利益・在庫・売れ残り
 *   置くもの       今日並んでいる花と、そこから一輪を選ぶことだけ
 *
 * プレイヤーが決めるのはひとつだけ ── **今日、店の入口に飾る花。**
 * 効果は付けません。能力も、売上補正も、何もありません。
 * 効果を付けた瞬間に「どれを選ぶと得か」に変わり、この店の軸から外れます。
 *
 * ── 何を出すかを、何で決めるか ────────────────────────────
 *
 *   ○  市場のリズム        季節・昨日と同じ顔ぶれにしない
 *   ×  プレイヤーの収集状況  まだ会っていない花を優先して出す
 *
 * 後者をやると、市場が**チェックリストを埋めにくる装置**になります。
 * 「まだ持っていない花を出してくれている」と気づかれた時点で、
 * ここは花屋ではなくなります。だから **market.ts は
 * プレイヤーの状態（library / favorites）を一切見ません。**
 *
 * ♡を付けた花を優遇するのも、同じ理由でやりません。
 * 再会が嬉しいのは、偶然そこにいたからです。
 * 店が再会を用意しはじめると、それは再会ではなくなります。
 *
 * ── 数（実測）────────────────────────────────────────
 *
 * 29種から毎日10輪、20日ぶん。完全にランダムでも：
 *
 *   1種あたりの登場       平均 5.5 回
 *   20日で一度も出ない     0.16%（29種のうち 0.05 種）
 *
 * 「昨日出た花は今日は出さない」を足すと、出ない花は 0.00 種になり、
 * 同じ花との再会は中央値3日になります。**それで足りています。**
 *
 * 並ばなかった花は、その日は店にもいません。
 * **それでいい**と決めました ── 花屋は図書館ではないので。
 * 会った花はアルバムに残り、♡はいつでも見られます
 * （→ src/data/shelf.ts「前提を、途中で変えました」）。
 */

import { FLOWERS, type Flower, type FlowerRole } from './flowers';
import type { SeasonId } from './seasons';

/**
 * 今日、市場から連れて帰る数。
 *
 * **これがそのまま、今日の店の棚になります。**
 * 少なすぎると束が組めず、多すぎると棚がまた長くなるので、
 * 束（3〜5本）を選ぶのに困らない数にしています。
 */
export const MARKET_SIZE = 10;

/**
 * 何を、どれだけ買うか。
 *
 * **役割を見ずに引いてはいけません。**
 * 実際に測ったら、役割を見ずに8輪引くと
 * **2日に1日はみどりが一本も入りませんでした（51.7%）。**
 * 葉ものの無い束は、どう組んでも締まりません。
 *
 * 花屋の仕入れは、そういう買い方をしません。
 * 主役を数本、寄り添う花を数本、すきまを埋める花、そして葉もの ──
 * **束が組める組み合わせで買います。**
 *
 * ここはプレイヤーには見えません。見えるのは
 * 「今日はいいのが入っているな」だけです。
 */
const BASKET: { role: FlowerRole; count: number }[] = [
  { role: 'main', count: 4 },
  { role: 'sub', count: 3 },
  { role: 'filler', count: 1 },
  { role: 'green', count: 1 },
];

/** その日ごとに決まる、ぶれない乱数。同じ日なら何度開いても同じ市場。 */
function roll(day: number, salt: number): number {
  const x = Math.sin(day * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** 何日ぶん、市場が自分の顔ぶれを覚えているか。 */
const LOOKBACK = 6;

/**
 * その花が、今日どれだけ市場に出やすいか。
 *
 * 季節がいちばん強く効きます ── 「今日はいいのが入っている」の中身は、
 * ほとんど旬のことなので。旬でない花も**0にはしません。**
 * 市場は毎日おなじ顔ぶれではないほうが、行く意味があります。
 *
 * `lastSeen` は、**市場自身が**その花を最後に並べてから何日たったか。
 * 昨日出たものは出にくく、しばらく見ていないものは出やすくします。
 *
 * ここで見ているのは**市場の履歴だけ**です。
 * プレイヤーがその花に会ったか、♡を付けたかは、一切見ません。
 */
function weight(flower: Flower, season: SeasonId, lastSeen: number): number {
  let w = 1;
  if (flower.seasons.includes(season)) w = 6;
  else if (flower.seasons.length >= 3) w = 3;

  // 昨日出たばかりなら半分以下に。しばらく出ていないなら少し上げる。
  // **0にはしません。** 「必ず◯日おきに回ってくる」は市場ではなく時刻表です。
  if (lastSeen <= 1) w *= 0.35;
  else if (lastSeen === 2) w *= 0.7;
  else if (lastSeen >= 5) w *= 1.5;
  return w;
}

/** 重みつきで1本引く。引いた花は pool から取り除く。 */
function pickOne(
  pool: Flower[],
  day: number,
  salt: number,
  season: SeasonId,
  lastSeen: Map<string, number>,
): Flower | null {
  if (pool.length === 0) return null;
  const w = pool.map((f) => weight(f, season, lastSeen.get(f.id) ?? 99));
  const total = w.reduce((a, b) => a + b, 0);
  let cut = roll(day, salt) * total;
  let index = pool.length - 1;
  for (let k = 0; k < pool.length; k += 1) {
    cut -= w[k];
    if (cut <= 0) {
      index = k;
      break;
    }
  }
  return pool.splice(index, 1)[0];
}

/** その日の仕入れ。役割ごとに、束が組める組み合わせで買う。 */
function pickDay(day: number, season: SeasonId, lastSeen: Map<string, number>): Flower[] {
  const rest = [...FLOWERS];
  const picked: Flower[] = [];
  let salt = 0;

  for (const { role, count } of BASKET) {
    for (let i = 0; i < count; i += 1) {
      const pool = rest.filter((f) => f.role === role);
      const got = pickOne(pool, day, salt, season, lastSeen);
      salt += 1;
      if (!got) break;
      rest.splice(rest.indexOf(got), 1);
      picked.push(got);
    }
  }
  // 残りは役割を問わず。ここで「今日はやけに◯◯が多いな」が生まれる。
  while (picked.length < MARKET_SIZE && rest.length > 0) {
    const got = pickOne(rest, day, salt, season, lastSeen);
    salt += 1;
    if (!got) break;
    picked.push(got);
  }
  return picked;
}

/**
 * 今日の市場。
 *
 * 直近 LOOKBACK 日ぶんを同じ式でたどって「最近出た度」を作ってから選びます。
 * **プレイヤーからは見えない偏り**です。画面には何も出しません。
 */
export function marketForDay(day: number, season: SeasonId): Flower[] {
  const lastSeen = new Map<string, number>();
  const start = Math.max(1, day - LOOKBACK);
  for (let d = start; d <= day; d += 1) {
    if (d === day) break;
    const past = pickDay(d, season, lastSeen);
    // その日より前の記録を1日ぶん古くしてから、その日のぶんを入れる
    for (const [id, age] of lastSeen) lastSeen.set(id, age + 1);
    for (const f of past) lastSeen.set(f.id, 1);
  }

  const picked = pickDay(day, season, lastSeen);
  // 並びも日ごとに変える。いつも同じ位置だと、市場ではなく棚になる。
  return picked.sort((a, b) => roll(day, a.id.length + 40) - roll(day, b.id.length + 40));
}

/**
 * その花に添える、短いひとこと。
 *
 * **値段もレア度も出しません。** 数字を出した瞬間、選ぶ理由が
 * 気持ちから比較に変わります。「今日いちばん」とも書きません ──
 * どれが正解かを言った時点で、選ぶことがなくなるので。
 *
 * 書くのは**状態と、その日のできごと**だけ。良し悪しは言いません。
 * 全部の花には付けません。三輪に一輪くらい。
 * 全部に付くと、ひとことではなく仕様欄になります。
 */
const REMARKS = [
  '朝露をまとっていました。',
  '今朝、少し早く咲いたそうです。',
  '昨日の雨で、色が濃くなったそうです。',
  '香りが立っています。',
  '茎がしっかりしています。',
  'つぼみが多めです。',
  '畑から届いたばかりだそうです。',
  '葉の緑が、いつもより深いです。',
  '今年は花が大きいそうです。',
  '朝いちばんに切ってきたそうです。',
];

export function remarkFor(day: number, flowerId: string): string | null {
  const seed = flowerId.split('').reduce((h, ch) => (h * 33 + ch.charCodeAt(0)) % 9973, 7);
  if (roll(day, seed) > 0.34) return null;
  return REMARKS[Math.floor(roll(day, seed + 5) * REMARKS.length) % REMARKS.length];
}

/**
 * 今日、入口の花に誰かが気づくか。
 *
 * **毎回褒めさせないこと。** 毎日言われると、それは報酬になります。
 * 「今日はこの花なんですね。」くらいの距離で、たまに。
 * 五日に一日ほど。良し悪しは言いません ── 選び方に正解を作らないので。
 */
export function noticesFront(day: number): boolean {
  return roll(day, 91) < 0.2;
}

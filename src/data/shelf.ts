/**
 * 今日の棚。
 *
 * 季節で花を**入れ替えません。** 変えるのは「出会いやすさ」だけです。
 *
 *   ×  冬になったらヒマワリが棚から消える
 *   ○  冬はヒマワリが奥のほうにある。「今日は少ないな」くらい
 *
 * 好きになった花が突然いなくなると、このゲームでいちばん守りたいもの
 * （好きな花ができること）が壊れます。だから**消しません。**
 *
 * やることは、並び順を変えることだけ。
 * 旬の花が手前に来て、季節はずれの花は少し奥になる。それだけです。
 */

import { FLOWERS, type Flower } from './flowers';
import type { SeasonId } from './seasons';

/**
 * 季節ごとの近さ。
 * 大きいほど手前（見つけやすい）。**0 にはしない**＝消さない。
 */
function nearness(flower: Flower, season: SeasonId): number {
  // いまが旬の花。いちばん手前に並ぶ。
  if (flower.seasons.includes(season)) return 3;
  // 通年の花。いつでも、そこにある。
  if (flower.seasons.length >= 3) return 2;
  // 季節はずれ。奥のほうにはあるが、**必ずある。**
  return 1;
}

/**
 * 今日の棚の並び。
 *
 * 同じ日には同じ並びになる（棚を見返すたびに変わると、店ではなく機械に見える）。
 *
 * ── 花が増えると、ここが効いてきます（実測）──────────────────
 *
 * 棚は全部の花を横一列に並べます。430px幅の画面で測ると：
 *
 *   21種   棚の全長 4,900px   画面 12.2個ぶん
 *   29種   棚の全長 6,788px   画面 16.9個ぶん   ← いま
 *   50種   （見込み）         画面 約29個ぶん
 *   182種  （見込み）         画面 約105個ぶん
 *
 * **50種を超えたあたりで、目当ての花に辿り着けなくなります。**
 * アルバムは並びが固定なので指が場所を覚えますが、棚は日ごとに
 * 少し動くので、覚えることができません。
 *
 * ここで安易に「季節外を消す」のはやってはいけません（上の決めごと）。
 * 好きになった花が棚から消えるのは、このゲームがいちばん壊してはいけない
 * ところです。**消さずに、遠さで表す**やり方を考えること。
 * 数の話ではなく、店の見え方の話なので、実装より先に⑭で決めます。
 */
export function shelfFor(season: SeasonId, day: number): Flower[] {
  return [...FLOWERS].sort((a, b) => {
    const gap = nearness(b, season) - nearness(a, season);
    if (gap !== 0) return gap;
    // 同じ近さの中では、日ごとに少しだけ順が変わる。
    // 毎日きっちり同じ並びだと、棚ではなく一覧に見えるので。
    const shuffle = (flower: Flower): number => {
      let hash = day * 31;
      for (const ch of flower.id) hash = (hash * 33 + ch.charCodeAt(0)) % 9973;
      return hash;
    };
    return shuffle(a) - shuffle(b);
  });
}

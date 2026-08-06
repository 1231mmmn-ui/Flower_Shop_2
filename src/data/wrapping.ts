/**
 * ラッピングペーパーとリボン。
 * id は IMAGE_ASSETS.md §6 の一覧と完全に一致させること。
 * 資材の画像は assets/wrap/<id>.png（紙のロール／リボンの巻き）。
 *
 * ブーケを包んだ姿そのものは、素材の色をもとにコード側で描いている
 * （IMAGE_ASSETS.md §2「1本の花を扇状に合成する現行方式」に合わせるため）。
 */

import type { Impression } from './flowers';

export interface Wrapping {
  id: string;
  name: string;
  /** 手ざわりの説明。選ぶ時間そのものを楽しんでもらう。 */
  texture: string;
  /** この紙が引き出す印象 */
  impressions: Impression[];
  price: number;
  /** 紙の色。資材画像の読み込み前の下地と、包んだ姿の描画に使う。 */
  swatch: string;
  /** 折り目の陰になる側の色 */
  shade: string;
  /** 光の当たる面の色 */
  light: string;
  /** 透ける紙か */
  sheer?: boolean;
  /**
   * リボンまで、紙の絵の中に描き込まれているか。
   *
   * クラフト紙は「花瓶ごと1枚」の花たちと同じく、完成画に描き直しました
   * （→ 2026-08-06 の見直し）。結び目のリボンも紙と一緒に描いてあるので、
   * これが true のときは、コード側の蝶結び（RibbonBow）を重ねません。
   * 重ねると、リボンが二重に見えてしまいます。
   *
   * まだ描き直していない紙は、これまでどおりコード側の蝶結びを重ねます。
   */
  hasBuiltInRibbon?: boolean;
}

export const WRAPPINGS: Wrapping[] = [
  {
    id: 'paper-kraft',
    name: 'クラフト紙',
    texture: 'ざらりとした手ざわり。花の色をいちばん素直に見せてくれます。',
    impressions: ['natural', 'calm'],
    price: 150,
    swatch: '#C4A578',
    shade: '#9A7B52',
    light: '#DCC198',
    hasBuiltInRibbon: true,
  },
  {
    id: 'paper-cream',
    name: 'クリーム',
    texture: 'やわらかい生成り。どんな花にもそっと寄り添います。',
    impressions: ['gentle', 'pure'],
    price: 180,
    swatch: '#F0E4CE',
    shade: '#CFBD9E',
    light: '#FCF5E7',
  },
  {
    id: 'paper-pink',
    name: 'くすみピンク',
    texture: '少しだけ灰色を含んだピンク。甘くなりすぎません。',
    impressions: ['gentle', 'warm'],
    price: 200,
    swatch: '#E0B3B8',
    shade: '#BC8B92',
    light: '#F3D4D7',
  },
  {
    id: 'paper-sage',
    name: 'セージグリーン',
    texture: '葉の色に近い緑。花より前に出てこない紙です。',
    impressions: ['natural', 'calm'],
    price: 200,
    swatch: '#B3C0A6',
    shade: '#8B9A7D',
    light: '#D0D9C4',
  },
  {
    id: 'paper-navy',
    name: 'ネイビー',
    texture: '深い紺。白や黄色の花を、はっきりと際立たせます。',
    impressions: ['elegant', 'calm'],
    price: 220,
    swatch: '#4E5A70',
    shade: '#333D4F',
    light: '#6E7C93',
  },
  {
    id: 'paper-lilac',
    name: 'ライラック',
    texture: '薄むらさき。光を通すと、内側がほのかに明るくなります。',
    impressions: ['elegant', 'pure'],
    price: 240,
    swatch: '#CBB9D6',
    shade: '#A692B4',
    light: '#E3D6EA',
    sheer: true,
  },
];

export interface Ribbon {
  id: string;
  name: string;
  texture: string;
  impressions: Impression[];
  price: number;
  swatch: string;
  shade: string;
  /** 艶の強さ（0〜1）。サテンは強く、リネンは弱い。 */
  sheen: number;
}

export const RIBBONS: Ribbon[] = [
  {
    id: 'ribbon-ivory',
    name: 'アイボリー',
    texture: 'なめらかで、光をゆっくり返します。',
    impressions: ['pure', 'elegant'],
    price: 120,
    swatch: '#F2E7D2',
    shade: '#D2C3A8',
    sheen: 0.55,
  },
  {
    id: 'ribbon-rose',
    name: 'ローズ',
    texture: '結び目のつやが、花の色とよく響きます。',
    impressions: ['gentle', 'warm'],
    price: 120,
    swatch: '#DDA0A8',
    shade: '#B87A83',
    sheen: 0.55,
  },
  {
    id: 'ribbon-gold',
    name: 'ゴールド',
    texture: '細い金の織り。特別な日にだけ、そっと使います。',
    impressions: ['elegant', 'lively'],
    price: 180,
    swatch: '#D6B26A',
    shade: '#AE8B45',
    sheen: 0.75,
  },
  {
    id: 'ribbon-moss',
    name: 'モスグリーン',
    texture: '麻の細い織り目。素朴で、少しかしこまらない感じ。',
    impressions: ['natural', 'calm'],
    price: 130,
    swatch: '#9AA87E',
    shade: '#77855E',
    sheen: 0.2,
  },
  {
    id: 'ribbon-blue',
    name: 'スモークブルー',
    texture: 'くすんだ青。白い花のとなりで、静かに落ち着きます。',
    impressions: ['calm', 'pure'],
    price: 140,
    swatch: '#9AAEBE',
    shade: '#75899A',
    sheen: 0.4,
  },
];

export const wrappingById = (id: string): Wrapping =>
  WRAPPINGS.find((wrap) => wrap.id === id) ?? WRAPPINGS[0];

export const ribbonById = (id: string): Ribbon =>
  RIBBONS.find((ribbon) => ribbon.id === id) ?? RIBBONS[0];

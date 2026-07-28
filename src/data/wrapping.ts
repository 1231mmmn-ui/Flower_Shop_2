/**
 * ラッピングペーパーとリボン。
 * id は IMAGE_ASSETS.md §5 / §6 の一覧と完全に一致させること。
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
  /** 紙の代表色。読み込み前の下地に使う。 */
  swatch: string;
}

export const WRAPPINGS: Wrapping[] = [
  {
    id: 'kraft',
    name: 'クラフト紙',
    texture: 'ざらりとした手ざわり。花の色をいちばん素直に見せてくれます。',
    impressions: ['natural', 'calm'],
    price: 150,
    swatch: '#C4A578',
  },
  {
    id: 'dustypink',
    name: 'くすみピンク',
    texture: '少しだけ灰色を含んだピンク。甘くなりすぎません。',
    impressions: ['gentle', 'warm'],
    price: 200,
    swatch: '#E0B3B8',
  },
  {
    id: 'navy',
    name: 'ネイビー',
    texture: '深い紺。白や黄色の花を、はっきりと際立たせます。',
    impressions: ['elegant', 'calm'],
    price: 200,
    swatch: '#4E5A70',
  },
  {
    id: 'cream',
    name: 'クリーム',
    texture: 'やわらかい生成り。どんな花にもそっと寄り添います。',
    impressions: ['gentle', 'pure'],
    price: 180,
    swatch: '#F0E4CE',
  },
  {
    id: 'washi',
    name: '和紙',
    texture: '繊維の見える紙。光を通すと、内側がほのかに明るくなります。',
    impressions: ['calm', 'elegant'],
    price: 260,
    swatch: '#EDE6D6',
  },
  {
    id: 'organdy',
    name: 'オーガンジー',
    texture: '透ける薄い布。包んだあとも、花がうっすら見えています。',
    impressions: ['pure', 'lively'],
    price: 280,
    swatch: '#EFEFE6',
  },
];

export interface Ribbon {
  id: string;
  name: string;
  texture: string;
  impressions: Impression[];
  price: number;
  swatch: string;
}

export const RIBBONS: Ribbon[] = [
  {
    id: 'satin_ivory',
    name: 'サテン（アイボリー）',
    texture: 'なめらかで、光をゆっくり返します。',
    impressions: ['pure', 'elegant'],
    price: 120,
    swatch: '#F2E7D2',
  },
  {
    id: 'satin_dustypink',
    name: 'サテン（くすみピンク）',
    texture: '結び目のつやが、花の色とよく響きます。',
    impressions: ['gentle', 'warm'],
    price: 120,
    swatch: '#E4B6BE',
  },
  {
    id: 'organdy_sage',
    name: 'オーガンジー（セージ）',
    texture: '透ける薄緑。葉の色と自然につながります。',
    impressions: ['natural', 'calm'],
    price: 140,
    swatch: '#C3CFB8',
  },
  {
    id: 'linen_brown',
    name: 'リネン（ブラウン）',
    texture: '麻の細い織り目。素朴で、少しかしこまらない感じ。',
    impressions: ['natural', 'warm'],
    price: 130,
    swatch: '#B49476',
  },
  {
    id: 'velvet_bordeaux',
    name: 'ベルベット（ボルドー）',
    texture: '厚みのある起毛。特別な日にだけ、そっと使います。',
    impressions: ['elegant', 'lively'],
    price: 180,
    swatch: '#8E5561',
  },
];

export const wrappingById = (id: string): Wrapping =>
  WRAPPINGS.find((wrap) => wrap.id === id) ?? WRAPPINGS[0];

export const ribbonById = (id: string): Ribbon =>
  RIBBONS.find((ribbon) => ribbon.id === id) ?? RIBBONS[0];

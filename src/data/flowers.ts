/**
 * このお店に並ぶ12種の切り花。
 * 名前・花言葉・価格・旬は、実際の花屋の値札にならっている。
 *
 * id は IMAGE_ASSETS.md §2 の一覧と完全に一致させること。
 */

import type { SeasonId } from './seasons';

/** ブーケの印象。お客様の希望との重なりを見るのに使う。 */
export type Impression =
  | 'bright'    // 明るい・元気
  | 'lively'    // 華やか
  | 'warm'      // あたたかい
  | 'gentle'    // やさしい
  | 'elegant'   // 上品
  | 'pure'      // 清らか
  | 'natural'   // ナチュラル
  | 'calm';     // 静か

export const IMPRESSION_LABEL: Record<Impression, string> = {
  bright: '明るい',
  lively: '華やか',
  warm: 'あたたかい',
  gentle: 'やさしい',
  elegant: '上品',
  pure: '清らか',
  natural: 'ナチュラル',
  calm: '静か',
};

/** 束ねたときの役割。花屋さんの組み方にならう。 */
export type FlowerRole = 'main' | 'sub' | 'filler' | 'green';

export const ROLE_LABEL: Record<FlowerRole, string> = {
  main: '主役の花',
  sub: '寄り添う花',
  filler: 'すきまを埋める花',
  green: '葉もの',
};

export type ColorTone = 'warm' | 'cool' | 'white' | 'green';

export const TONE_LABEL: Record<ColorTone, string> = {
  warm: 'あたたかい色',
  cool: '涼しい色',
  white: '白',
  green: 'みどり',
};

export interface Flower {
  id: string;
  name: string;
  reading: string;
  /** 1本の値段（円） */
  price: number;
  /** 花言葉 */
  meanings: string[];
  /** 値札に書かれた旬 */
  seasonLabel: string;
  /** 特に生き生きしている季節 */
  seasons: SeasonId[];
  /** おすすめ用途 */
  occasions: string[];
  /** ブーケとの相性（相手の flower id） */
  goesWith: string[];
  /** 相性のひとこと */
  goesWithNote: string;
  role: FlowerRole;
  tone: ColorTone;
  impressions: Impression[];
  /** 花を眺めているときに、そっと添える言葉 */
  note: string;
  /** 花の代表色。UIの下地やぼかしに使う（花そのものは画像） */
  swatch: string;
  /** 茎の長さの目安。ブーケの高さに効く（0.8〜1.2） */
  stature: number;
}

export const FLOWERS: Flower[] = [
  {
    id: 'sunflower',
    name: 'ヒマワリ',
    reading: 'ひまわり',
    price: 440,
    meanings: ['憧れ', 'あなただけを見つめる'],
    seasonLabel: '夏の代表花',
    seasons: ['summer'],
    occasions: ['誕生日', '元気になってほしい人へ', '夏の贈りもの'],
    goesWith: ['gerbera', 'alstroemeria', 'eucalyptus'],
    goesWithNote: '黄色は少し離して置くと、他の花の色が引き立ちます。',
    role: 'main',
    tone: 'warm',
    impressions: ['bright', 'warm', 'lively'],
    note: '花びらの一枚一枚が、まだ陽の方を向いたままです。',
    swatch: '#F0B62A',
    stature: 1.15,
  },
  {
    id: 'lisianthus',
    name: 'トルコキキョウ',
    reading: 'とるこききょう',
    price: 660,
    meanings: ['優美', '希望', '感謝'],
    seasonLabel: '通年',
    seasons: ['spring', 'summer', 'autumn', 'winter'],
    occasions: ['お祝い', 'お礼', '目上の方へ'],
    goesWith: ['rose', 'babysbreath', 'eucalyptus'],
    goesWithNote: 'ふんわりした花びらが、束全体の輪郭をやわらかくしてくれます。',
    role: 'main',
    tone: 'cool',
    impressions: ['elegant', 'gentle'],
    note: '薄い紙を何枚も重ねたような花びら。光にすかすと葉脈が見えます。',
    swatch: '#8C79C6',
    stature: 1.05,
  },
  {
    id: 'lily',
    name: 'ユリ',
    reading: 'ゆり',
    price: 770,
    meanings: ['純粋', '無垢', '威厳'],
    seasonLabel: '通年',
    seasons: ['spring', 'summer', 'autumn', 'winter'],
    occasions: ['お祝い', '記念日', '想いを伝えたいとき'],
    goesWith: ['lisianthus', 'eucalyptus', 'babysbreath'],
    goesWithNote: '一本入るだけで束の背が高くなり、ゆったりした形になります。',
    role: 'main',
    tone: 'white',
    impressions: ['pure', 'elegant', 'calm'],
    note: '香りが強い花です。渡したあと、部屋にしばらく残ります。',
    swatch: '#F6EFDF',
    stature: 1.2,
  },
  {
    id: 'carnation',
    name: 'カーネーション',
    reading: 'かーねーしょん',
    price: 330,
    meanings: ['感謝', '温かい心'],
    seasonLabel: '通年',
    seasons: ['spring', 'summer', 'autumn', 'winter'],
    occasions: ['母の日', 'ありがとうを伝える日', '普段のお礼'],
    goesWith: ['rose', 'babysbreath', 'statice'],
    goesWithNote: 'フリルが多いので、すきまが自然に埋まります。',
    role: 'sub',
    tone: 'warm',
    impressions: ['warm', 'gentle'],
    note: '花びらの縁が細かく波打っていて、触れるとかさりと鳴ります。',
    swatch: '#EE8AAA',
    stature: 0.95,
  },
  {
    id: 'delphinium',
    name: 'デルフィニウム',
    reading: 'でるふぃにうむ',
    price: 660,
    meanings: ['清明', 'あなたは幸福をふりまく'],
    seasonLabel: '夏',
    seasons: ['summer'],
    occasions: ['夏の贈りもの', '涼しさを届けたいとき', '新しい門出'],
    goesWith: ['babysbreath', 'lily', 'eucalyptus'],
    goesWithNote: '縦に伸びるので、束に高さと風通しが生まれます。',
    role: 'sub',
    tone: 'cool',
    impressions: ['pure', 'calm', 'natural'],
    note: '小さな青が穂になって、上へ上へと咲いていきます。',
    swatch: '#6E90D4',
    stature: 1.18,
  },
  {
    id: 'babysbreath',
    name: 'かすみ草',
    reading: 'かすみそう',
    price: 330,
    meanings: ['感謝', '幸福', '清らかな心'],
    seasonLabel: '通年',
    seasons: ['spring', 'summer', 'autumn', 'winter'],
    occasions: ['どんな花束にも', 'ささやかな贈りもの'],
    goesWith: ['rose', 'carnation', 'gerbera'],
    goesWithNote: '主役の花のまわりに散らすと、束がふわりと明るくなります。',
    role: 'filler',
    tone: 'white',
    impressions: ['gentle', 'pure', 'natural'],
    note: '白い霧のような花。近づくと、ひとつひとつがちゃんと花の形です。',
    swatch: '#FBF7EE',
    stature: 1.0,
  },
  {
    id: 'rose',
    name: 'バラ',
    reading: 'ばら',
    price: 550,
    meanings: ['感謝', 'しとやか', '上品'],
    seasonLabel: '通年',
    seasons: ['spring', 'summer', 'autumn', 'winter'],
    occasions: ['記念日', 'プロポーズ', '特別な人へ'],
    goesWith: ['babysbreath', 'lisianthus', 'eucalyptus'],
    goesWithNote: '主役に据えて、まわりを白と緑で静かに囲むと映えます。',
    role: 'main',
    tone: 'warm',
    impressions: ['elegant', 'gentle', 'lively'],
    note: '外側の花びらほど色が濃く、中心へいくほど淡くなっていきます。',
    swatch: '#EE93AB',
    stature: 1.08,
  },
  {
    id: 'hydrangea',
    name: 'アジサイ',
    reading: 'あじさい',
    price: 550,
    meanings: ['家族団らん', '和気あいあい'],
    seasonLabel: '初夏〜夏',
    seasons: ['spring', 'summer'],
    occasions: ['新居祝い', 'ご家族へ', '季節を楽しむ花'],
    goesWith: ['eucalyptus', 'lisianthus', 'babysbreath'],
    goesWithNote: '大きな塊なので、一本で束の芯になってくれます。',
    role: 'main',
    tone: 'green',
    impressions: ['natural', 'calm', 'gentle'],
    note: '小さな花が寄り集まって、ひとつの丸をつくっています。',
    swatch: '#EDF1E2',
    stature: 1.0,
  },
  {
    id: 'gerbera',
    name: 'ガーベラ',
    reading: 'がーべら',
    price: 440,
    meanings: ['希望', '前進', '感謝'],
    seasonLabel: '通年',
    seasons: ['spring', 'summer', 'autumn', 'winter'],
    occasions: ['誕生日', '応援したいとき', 'お見舞いのあとの快気祝い'],
    goesWith: ['sunflower', 'babysbreath', 'statice'],
    goesWithNote: '丸い花なので、束の正面に置くと表情が出ます。',
    role: 'main',
    tone: 'warm',
    impressions: ['bright', 'lively', 'warm'],
    note: 'まっすぐな茎の先で、まんまるの花がこちらを向いています。',
    swatch: '#F0879C',
    stature: 1.05,
  },
  {
    id: 'alstroemeria',
    name: 'アルストロメリア',
    reading: 'あるすとろめりあ',
    price: 440,
    meanings: ['持続', '未来への憧れ'],
    seasonLabel: '通年',
    seasons: ['spring', 'summer', 'autumn', 'winter'],
    occasions: ['長く楽しみたいとき', '開店祝い', '日々の花'],
    goesWith: ['sunflower', 'eucalyptus', 'statice'],
    goesWithNote: '一本にいくつも花が付くので、少ない本数でも束が豊かになります。',
    role: 'sub',
    tone: 'warm',
    impressions: ['bright', 'natural', 'warm'],
    note: '花びらの内側に細かな斑点。よく見ると一つずつ模様が違います。',
    swatch: '#F2D688',
    stature: 1.02,
  },
  {
    id: 'statice',
    name: 'スターチス',
    reading: 'すたーちす',
    price: 330,
    meanings: ['変わらぬ心', '永遠に変わらない'],
    seasonLabel: '通年',
    seasons: ['spring', 'summer', 'autumn', 'winter'],
    occasions: ['ドライフラワーにも', '長く残したい想いに'],
    goesWith: ['carnation', 'gerbera', 'eucalyptus'],
    goesWithNote: 'かさりとした手ざわり。束の縁に置くと形が決まります。',
    role: 'filler',
    tone: 'cool',
    impressions: ['calm', 'natural'],
    note: '乾いても色が残る花。飾り終えたあとも、しばらく一緒にいられます。',
    swatch: '#8E7BC8',
    stature: 1.0,
  },
  {
    id: 'eucalyptus',
    name: 'ユーカリ',
    reading: 'ゆーかり',
    price: 330,
    meanings: ['再生', '新生', '思い出'],
    seasonLabel: '通年',
    seasons: ['spring', 'summer', 'autumn', 'winter'],
    occasions: ['ナチュラルな花束に', '男性への贈りもの', '新生活のお祝い'],
    goesWith: ['rose', 'lisianthus', 'hydrangea'],
    goesWithNote: '葉ものを一本足すだけで、束全体が落ち着きます。',
    role: 'green',
    tone: 'green',
    impressions: ['natural', 'calm'],
    note: '丸い葉を指でこすると、すっとした香りが手に残ります。',
    swatch: '#A8BCA2',
    stature: 1.12,
  },
];

export const flowerById = (id: string): Flower =>
  FLOWERS.find((flower) => flower.id === id) ?? FLOWERS[0];

export const formatPrice = (yen: number): string => `¥${yen.toLocaleString('ja-JP')}`;
